import { describe, expect, it } from 'vitest';

import { ReportSidePanelFailure } from '@/application/use-cases/ReportSidePanelFailure';

import { FakeClock } from '../../../setup/fakes/FakeClock';
import { FixedIdGenerator } from '../../../setup/fakes/FixedIdGenerator';
import { SpyErrorReporter } from '../../../setup/fakes/SpyErrorReporter';

describe('ReportSidePanelFailure', () => {
  it('should_send_a_side_panel_warning_report_with_a_fresh_id_and_the_current_time', async () => {
    const reporter = new SpyErrorReporter();
    const clock = new FakeClock(new Date('2026-05-09T14:23:05.000Z'));
    const ids = new FixedIdGenerator('panel');
    const useCase = new ReportSidePanelFailure(reporter, clock, ids);

    await useCase.execute({
      kind: 'preferences_load_failed',
      message: 'Snipworth could not load saved preferences.',
    });

    expect(reporter.reports).toHaveLength(1);
    expect(reporter.reports[0]?.toSnapshot()).toEqual({
      id: 'panel-1',
      kind: 'preferences_load_failed',
      message: 'Snipworth could not load saved preferences.',
      occurredAt: '2026-05-09T14:23:05.000Z',
      source: 'side_panel',
      severity: 'warning',
    });
  });

  it('should_carry_the_cause_description_truncated_into_the_report_details', async () => {
    const reporter = new SpyErrorReporter();
    const useCase = new ReportSidePanelFailure(
      reporter,
      new FakeClock(),
      new FixedIdGenerator('panel'),
    );

    await useCase.execute({
      kind: 'snippet_export_failed',
      message: 'Could not export snippet.',
      cause: new Error('rasterization went wrong'),
    });

    expect(reporter.reports[0]?.details).toBe('rasterization went wrong');
  });

  it('should_use_the_caller_supplied_severity_when_provided', async () => {
    const reporter = new SpyErrorReporter();
    const useCase = new ReportSidePanelFailure(
      reporter,
      new FakeClock(),
      new FixedIdGenerator('panel'),
    );

    await useCase.execute({
      kind: 'snippet_export_failed',
      message: 'Could not export snippet.',
      severity: 'error',
    });

    expect(reporter.reports[0]?.severity).toBe('error');
  });

  it('should_omit_details_when_no_cause_is_provided', async () => {
    const reporter = new SpyErrorReporter();
    const useCase = new ReportSidePanelFailure(
      reporter,
      new FakeClock(),
      new FixedIdGenerator('panel'),
    );

    await useCase.execute({
      kind: 'preferences_load_failed',
      message: 'Snipworth could not load saved preferences.',
    });

    expect(reporter.reports[0]?.details).toBeUndefined();
  });

  it('should_propagate_the_reporter_outcome_to_callers', async () => {
    const reporter = new SpyErrorReporter();
    reporter.failNextReportWith(new Error('storage offline'));
    const useCase = new ReportSidePanelFailure(
      reporter,
      new FakeClock(),
      new FixedIdGenerator('panel'),
    );

    const outcome = await useCase.execute({
      kind: 'preferences_load_failed',
      message: 'fail',
    });

    expect(outcome.kind).toBe('reporter_failed');
  });
});
