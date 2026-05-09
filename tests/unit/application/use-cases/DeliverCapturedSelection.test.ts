import { describe, it, expect } from 'vitest';
import type {
  CaptureCourier,
  CaptureDeliveryTarget,
  DeliverCaptureOutcome,
} from '@/application/ports/CaptureCourier';
import type { ErrorReporter, ReportOutcome } from '@/application/ports/ErrorReporter';
import { DeliverCapturedSelection } from '@/application/use-cases/DeliverCapturedSelection';
import { CapturedSelection } from '@/domain/capture/CapturedSelection';
import { ErrorReport, type ErrorReportSnapshot } from '@/domain/error-reporting/ErrorReport';
import { FakeClock } from '../../../setup/fakes/FakeClock';
import { FixedIdGenerator } from '../../../setup/fakes/FixedIdGenerator';

interface RecordedDelivery {
  readonly selection: CapturedSelection;
  readonly target: CaptureDeliveryTarget;
}

class StubCourier implements CaptureCourier {
  readonly deliveries: RecordedDelivery[] = [];

  constructor(private readonly outcome: DeliverCaptureOutcome) {}

  deliver(
    selection: CapturedSelection,
    target: CaptureDeliveryTarget,
  ): Promise<DeliverCaptureOutcome> {
    this.deliveries.push({ selection, target });
    return Promise.resolve(this.outcome);
  }
}

class SpyReporter implements ErrorReporter {
  readonly reports: ErrorReport[] = [];

  report(error: ErrorReport): Promise<ReportOutcome> {
    this.reports.push(error);
    return Promise.resolve({ kind: 'reported' });
  }
}

function aSelection(): CapturedSelection {
  return CapturedSelection.from({ code: 'const x = 1;', sourceUrl: 'https://example.com/page' });
}

function aTarget(): CaptureDeliveryTarget {
  return { tabId: 7 };
}

function build(courier: CaptureCourier, reporter: ErrorReporter): DeliverCapturedSelection {
  return new DeliverCapturedSelection({
    courier,
    reporter,
    clock: new FakeClock(new Date('2026-01-01T00:00:00.000Z')),
    ids: new FixedIdGenerator('report'),
  });
}

function reportSnapshot(report: ErrorReport | undefined): ErrorReportSnapshot | undefined {
  return report?.toSnapshot();
}

describe('DeliverCapturedSelection', () => {
  it('should_pass_the_selection_and_target_to_the_courier', async () => {
    const courier = new StubCourier({ kind: 'delivered' });
    const useCase = build(courier, new SpyReporter());

    const selection = aSelection();
    await useCase.execute(selection, aTarget());

    expect(courier.deliveries).toEqual([{ selection, target: { tabId: 7 } }]);
  });

  it('should_not_report_an_error_when_delivery_succeeds', async () => {
    const reporter = new SpyReporter();
    const useCase = build(new StubCourier({ kind: 'delivered' }), reporter);

    await useCase.execute(aSelection(), aTarget());

    expect(reporter.reports).toEqual([]);
  });

  it('should_report_a_capture_storage_failed_event_when_courier_returns_storage_failed', async () => {
    const reporter = new SpyReporter();
    const cause = new Error('quota exceeded');
    const useCase = build(new StubCourier({ kind: 'storage_failed', cause }), reporter);

    await useCase.execute(aSelection(), aTarget());

    expect(reportSnapshot(reporter.reports[0])).toEqual({
      id: 'report-1',
      kind: 'capture_storage_failed',
      message: 'Snipworth could not stage the captured selection.',
      occurredAt: '2026-01-01T00:00:00.000Z',
      source: 'background',
      severity: 'error',
      details: 'quota exceeded',
    });
  });

  it('should_report_a_capture_panel_open_failed_event_when_courier_returns_panel_open_failed', async () => {
    const reporter = new SpyReporter();
    const cause = new Error('no such tab');
    const useCase = build(new StubCourier({ kind: 'panel_open_failed', cause }), reporter);

    await useCase.execute(aSelection(), aTarget());

    expect(reportSnapshot(reporter.reports[0])).toEqual({
      id: 'report-1',
      kind: 'capture_panel_open_failed',
      message: 'Snipworth could not open the side panel for the captured selection.',
      occurredAt: '2026-01-01T00:00:00.000Z',
      source: 'background',
      severity: 'error',
      details: 'no such tab',
    });
  });
});
