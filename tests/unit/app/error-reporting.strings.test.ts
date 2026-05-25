import { describe, it, expect } from 'vitest';
import {
  CONSOLE_FIELD_MAX_BYTES,
  reportIssueUrl,
  unexpectedEventsLabel,
} from '@/adapters/primary/app/error-reporting.strings';
import { ErrorReport } from '@/domain/error-reporting/ErrorReport';

const REPORTED_AT = new Date('2026-01-01T00:00:00.000Z');

function anError(id: string, details?: string): ErrorReport {
  return ErrorReport.from({
    id,
    kind: 'invalid_message',
    message: `event ${id}`,
    source: 'router',
    severity: 'warning',
    occurredAt: REPORTED_AT,
    ...(details !== undefined ? { details } : {}),
  });
}

function extractParam(url: string, name: string): string | null {
  const params = new URL(url).searchParams;
  return params.get(name);
}

describe('reportIssueUrl', () => {
  it('should_select_the_bug_report_template', () => {
    const url = reportIssueUrl([anError('id-1')]);

    expect(extractParam(url, 'template')).toBe('bug_report.yml');
  });

  it('should_prefill_what_happened_with_the_event_summary', () => {
    const url = reportIssueUrl([anError('id-1')]);

    const whatHappened = extractParam(url, 'what-happened');
    expect(whatHappened).toContain('Snipworth encountered an unexpected event.');
    expect(whatHappened).toContain('Console errors');
  });

  it('should_prefill_console_with_the_error_json_when_inbox_is_loaded', () => {
    const url = reportIssueUrl([anError('id-1')]);

    expect(extractParam(url, 'console')).toContain('invalid_message');
  });

  it('should_omit_console_param_when_no_errors_are_provided', () => {
    const url = reportIssueUrl([]);

    expect(extractParam(url, 'console')).toBeNull();
    expect(extractParam(url, 'what-happened')).toContain(
      'Snipworth could not load its pending error inbox.',
    );
  });

  it('should_truncate_console_with_a_marker_when_payload_exceeds_the_budget', () => {
    const huge = Array.from({ length: 50 }, (_, i) => anError(`id-${String(i)}`, 'a'.repeat(1000)));

    const url = reportIssueUrl(huge);
    const consoleField = extractParam(url, 'console') ?? '';

    expect(consoleField.length).toBeLessThanOrEqual(CONSOLE_FIELD_MAX_BYTES);
    expect(consoleField).toContain('events truncated');
  });

  it('should_keep_full_console_when_payload_fits_in_the_budget', () => {
    const small = [anError('id-1', 'short')];

    const url = reportIssueUrl(small);

    expect(extractParam(url, 'console')).not.toContain('events truncated');
  });
});

describe('unexpectedEventsLabel', () => {
  it('should_render_singular_when_count_is_one', () => {
    expect(unexpectedEventsLabel(1)).toBe('Snipworth encountered an unexpected event.');
  });

  it('should_render_plural_when_count_is_more_than_one', () => {
    expect(unexpectedEventsLabel(2)).toBe('Snipworth encountered 2 unexpected events.');
  });
});
