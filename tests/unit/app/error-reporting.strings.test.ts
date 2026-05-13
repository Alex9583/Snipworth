import { describe, it, expect } from 'vitest';
import {
  ISSUE_BODY_MAX_BYTES,
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

describe('reportIssueUrl', () => {
  it('should_produce_a_url_pointing_to_the_repository_issues_form', () => {
    const url = reportIssueUrl([anError('id-1')]);

    expect(url).toMatch(/^https?:\/\/.+\/issues\/new\?body=/);
  });

  it('should_include_the_error_kind_in_the_body_when_inbox_is_loaded', () => {
    const url = reportIssueUrl([anError('id-1')]);

    expect(decodeURIComponent(url)).toContain('invalid_message');
  });

  it('should_use_a_minimal_body_when_no_errors_are_provided', () => {
    const url = reportIssueUrl([]);

    expect(decodeURIComponent(url)).toContain('Snipworth could not load its pending error inbox.');
  });

  it('should_truncate_the_body_with_a_marker_when_payload_exceeds_the_budget', () => {
    const huge = Array.from({ length: 50 }, (_, i) => anError(`id-${String(i)}`, 'a'.repeat(1000)));

    const url = reportIssueUrl(huge);
    const decodedBody = decodeURIComponent(url.split('?body=')[1] ?? '');

    expect(decodedBody.length).toBeLessThanOrEqual(ISSUE_BODY_MAX_BYTES);
    expect(decodedBody).toContain('events truncated');
  });

  it('should_keep_the_full_body_when_payload_fits_in_the_budget', () => {
    const small = [anError('id-1', 'short')];

    const url = reportIssueUrl(small);
    const decodedBody = decodeURIComponent(url.split('?body=')[1] ?? '');

    expect(decodedBody).not.toContain('events truncated');
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
