import { describe, it, expect } from 'vitest';
import { parseInbox } from '@/adapters/secondary/error-channel/readInbox';
import { ErrorReport } from '@/domain/error-reporting/ErrorReport';
import { FakeClock } from '../../setup/fakes/FakeClock';
import { FixedIdGenerator } from '../../setup/fakes/FixedIdGenerator';

const REPORTED_AT = new Date('2026-01-01T00:00:00.000Z');

const aSetupError = ErrorReport.from({
  id: 'setup-1',
  kind: 'side_panel_setup_failed',
  message: 'Could not configure the side panel.',
  source: 'background',
  severity: 'error',
  occurredAt: REPORTED_AT,
});

function makeDeps(clock = new FakeClock()) {
  return { clock, ids: new FixedIdGenerator('marker') };
}

describe('parseInbox', () => {
  it('should_return_empty_when_raw_is_undefined', () => {
    const result = parseInbox(undefined, makeDeps());

    expect(result).toEqual({ kind: 'empty' });
  });

  it('should_return_loaded_with_empty_errors_when_raw_is_an_empty_array', () => {
    const result = parseInbox([], makeDeps());

    expect(result.kind).toBe('loaded');
    if (result.kind !== 'loaded') return;
    expect(result.errors).toEqual([]);
  });

  it('should_return_loaded_with_errors_when_raw_matches_schema', () => {
    const result = parseInbox([aSetupError.toSnapshot()], makeDeps());

    expect(result.kind).toBe('loaded');
    if (result.kind !== 'loaded') return;
    expect(result.errors.map((e) => e.toSnapshot())).toEqual([aSetupError.toSnapshot()]);
  });

  it('should_return_corrupt_with_marker_when_raw_is_not_an_array', () => {
    const clock = new FakeClock(new Date('2026-02-15T12:00:00.000Z'));

    const result = parseInbox('not an array', makeDeps(clock));

    expect(result.kind).toBe('corrupt');
    if (result.kind !== 'corrupt') return;
    expect(result.marker.kind).toBe('error_inbox_corrupt');
    expect(result.marker.severity).toBe('warning');
    expect(result.marker.source).toBe('background');
    expect(result.marker.occurredAt).toEqual(new Date('2026-02-15T12:00:00.000Z'));
    expect(result.marker.id).toBe('marker-1');
  });

  it('should_return_corrupt_with_marker_when_one_report_in_the_array_is_malformed', () => {
    const result = parseInbox(
      [aSetupError.toSnapshot(), { id: '', kind: 'invalid', message: '' }],
      makeDeps(),
    );

    expect(result.kind).toBe('corrupt');
  });

  it('should_carry_a_non_empty_details_in_marker_describing_the_corruption', () => {
    const result = parseInbox({ unexpected: 'shape' }, makeDeps());

    expect(result.kind).toBe('corrupt');
    if (result.kind !== 'corrupt') return;
    expect(result.marker.details).toBeDefined();
    expect((result.marker.details ?? '').length).toBeGreaterThan(0);
  });

  it('should_cap_marker_details_to_the_domain_error_details_max', () => {
    // Create an array with many invalid entries to force a long describeCause output.
    const manyInvalidEntries = Array.from({ length: 200 }, () => ({ wrong: 'shape' }));

    const result = parseInbox(manyInvalidEntries, makeDeps());

    expect(result.kind).toBe('corrupt');
    if (result.kind !== 'corrupt') return;
    expect((result.marker.details ?? '').length).toBeLessThanOrEqual(1000);
  });
});
