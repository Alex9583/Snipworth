import { describe, expect, it } from 'vitest';

import type { CaptureCourier, DeliverCaptureOutcome } from '@/application/ports/CaptureCourier';
import type { FullTabOpener, OpenFullTabOutcome } from '@/application/ports/FullTabOpener';
import { OpenFullTabEditor } from '@/application/use-cases/OpenFullTabEditor';
import type { CapturedSelection } from '@/domain/capture/CapturedSelection';

class StubCourier implements CaptureCourier {
  readonly deliveries: CapturedSelection[] = [];

  constructor(private readonly outcome: DeliverCaptureOutcome) {}

  deliver(selection: CapturedSelection): Promise<DeliverCaptureOutcome> {
    this.deliveries.push(selection);
    return Promise.resolve(this.outcome);
  }
}

class SpyOpener implements FullTabOpener {
  readonly calls: number[] = [];

  constructor(private readonly outcome: OpenFullTabOutcome) {}

  openFullTab(): Promise<OpenFullTabOutcome> {
    this.calls.push(this.calls.length + 1);
    return Promise.resolve(this.outcome);
  }
}

describe('OpenFullTabEditor', () => {
  it('should_open_the_full_tab_without_delivering_when_code_is_empty', async () => {
    const courier = new StubCourier({ kind: 'delivered' });
    const opener = new SpyOpener({ kind: 'opened' });
    const useCase = new OpenFullTabEditor(courier, opener);

    const outcome = await useCase.execute('');

    expect(outcome).toEqual({ kind: 'opened', deliveredCode: false });
    expect(courier.deliveries).toHaveLength(0);
    expect(opener.calls).toHaveLength(1);
  });

  it('should_deliver_the_code_then_open_the_full_tab_when_code_is_non_empty', async () => {
    const courier = new StubCourier({ kind: 'delivered' });
    const opener = new SpyOpener({ kind: 'opened' });
    const useCase = new OpenFullTabEditor(courier, opener);

    const outcome = await useCase.execute('const x = 1;');

    expect(outcome).toEqual({ kind: 'opened', deliveredCode: true });
    expect(courier.deliveries).toHaveLength(1);
    expect(courier.deliveries[0]?.code).toBe('const x = 1;');
    expect(opener.calls).toHaveLength(1);
  });

  it('should_return_deliver_failed_without_opening_when_courier_reports_storage_failed', async () => {
    const cause = new Error('quota exceeded');
    const courier = new StubCourier({ kind: 'storage_failed', cause });
    const opener = new SpyOpener({ kind: 'opened' });
    const useCase = new OpenFullTabEditor(courier, opener);

    const outcome = await useCase.execute('const x = 1;');

    expect(outcome).toEqual({ kind: 'deliver_failed', cause });
    expect(opener.calls).toHaveLength(0);
  });

  it('should_return_open_failed_when_opener_reports_open_failed_after_successful_delivery', async () => {
    const cause = new Error('chrome refused to open tab');
    const courier = new StubCourier({ kind: 'delivered' });
    const opener = new SpyOpener({ kind: 'open_failed', cause });
    const useCase = new OpenFullTabEditor(courier, opener);

    const outcome = await useCase.execute('const x = 1;');

    expect(outcome).toEqual({ kind: 'open_failed', cause });
    expect(courier.deliveries).toHaveLength(1);
  });

  it('should_return_open_failed_when_opener_reports_open_failed_with_empty_code', async () => {
    const cause = new Error('chrome refused to open tab');
    const courier = new StubCourier({ kind: 'delivered' });
    const opener = new SpyOpener({ kind: 'open_failed', cause });
    const useCase = new OpenFullTabEditor(courier, opener);

    const outcome = await useCase.execute('');

    expect(outcome).toEqual({ kind: 'open_failed', cause });
    expect(courier.deliveries).toHaveLength(0);
  });
});
