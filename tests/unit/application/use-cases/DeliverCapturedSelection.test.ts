import { describe, it, expect } from 'vitest';
import type { PanelOpenOutcome } from '@/application/ports/BrowserHost';
import type { CaptureCourier, DeliverCaptureOutcome } from '@/application/ports/CaptureCourier';
import type { ErrorReporter, ReportOutcome } from '@/application/ports/ErrorReporter';
import { DeliverCapturedSelection } from '@/application/use-cases/DeliverCapturedSelection';
import { CapturedSelection } from '@/domain/capture/CapturedSelection';
import { ErrorReport, type ErrorReportSnapshot } from '@/domain/error-reporting/ErrorReport';
import { FakeClock } from '../../../setup/fakes/FakeClock';
import { FixedIdGenerator } from '../../../setup/fakes/FixedIdGenerator';

class StubCourier implements CaptureCourier {
  readonly deliveries: CapturedSelection[] = [];

  constructor(private readonly outcome: DeliverCaptureOutcome) {}

  deliver(selection: CapturedSelection): Promise<DeliverCaptureOutcome> {
    this.deliveries.push(selection);
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

function panelOpened(): Promise<PanelOpenOutcome> {
  return Promise.resolve({ kind: 'panel_opened' });
}

function panelFailed(cause: unknown): Promise<PanelOpenOutcome> {
  return Promise.resolve({ kind: 'panel_open_failed', cause });
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
  it('should_pass_the_selection_to_the_courier_when_panel_opens_successfully', async () => {
    const courier = new StubCourier({ kind: 'delivered' });
    const useCase = build(courier, new SpyReporter());

    const selection = aSelection();
    await useCase.execute(selection, panelOpened());

    expect(courier.deliveries).toEqual([selection]);
  });

  it('should_not_report_an_error_when_panel_opens_and_storage_succeeds', async () => {
    const reporter = new SpyReporter();
    const useCase = build(new StubCourier({ kind: 'delivered' }), reporter);

    await useCase.execute(aSelection(), panelOpened());

    expect(reporter.reports).toEqual([]);
  });

  it('should_return_delivered_when_panel_opens_and_storage_succeeds', async () => {
    const useCase = build(new StubCourier({ kind: 'delivered' }), new SpyReporter());

    const outcome = await useCase.execute(aSelection(), panelOpened());

    expect(outcome).toEqual({ kind: 'delivered' });
  });

  it('should_report_a_capture_storage_failed_event_when_courier_returns_storage_failed', async () => {
    const reporter = new SpyReporter();
    const cause = new Error('quota exceeded');
    const useCase = build(new StubCourier({ kind: 'storage_failed', cause }), reporter);

    await useCase.execute(aSelection(), panelOpened());

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

  it('should_report_a_capture_panel_open_failed_event_when_panel_opening_rejects', async () => {
    const reporter = new SpyReporter();
    const cause = new Error('no user gesture');
    const useCase = build(new StubCourier({ kind: 'delivered' }), reporter);

    await useCase.execute(aSelection(), panelFailed(cause));

    expect(reportSnapshot(reporter.reports[0])).toEqual({
      id: 'report-1',
      kind: 'capture_panel_open_failed',
      message: 'Snipworth could not open the side panel for the captured selection.',
      occurredAt: '2026-01-01T00:00:00.000Z',
      source: 'background',
      severity: 'error',
      details: 'no user gesture',
    });
  });

  it('should_still_deliver_the_selection_to_storage_when_panel_open_fails', async () => {
    const courier = new StubCourier({ kind: 'delivered' });
    const useCase = build(courier, new SpyReporter());

    const selection = aSelection();
    await useCase.execute(selection, panelFailed(new Error('boom')));

    expect(courier.deliveries).toEqual([selection]);
  });

  it('should_report_both_panel_open_failed_and_storage_failed_when_both_fail', async () => {
    const reporter = new SpyReporter();
    const panelCause = new Error('no user gesture');
    const storageCause = new Error('quota exceeded');
    const useCase = build(
      new StubCourier({ kind: 'storage_failed', cause: storageCause }),
      reporter,
    );

    await useCase.execute(aSelection(), panelFailed(panelCause));

    expect(reporter.reports.map((r) => r.toSnapshot().kind)).toEqual([
      'capture_panel_open_failed',
      'capture_storage_failed',
    ]);
  });
});
