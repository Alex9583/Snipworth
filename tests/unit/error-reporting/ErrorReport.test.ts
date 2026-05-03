import { describe, it, expect } from 'vitest';
import {
  ErrorReport,
  InvalidErrorReport,
  type ErrorReportSnapshot,
} from '@/domain/error-reporting/ErrorReport';

const REPORTED_AT = new Date('2026-03-15T10:00:00.000Z');

describe('ErrorReport.from', () => {
  it('should_carry_the_provided_id_into_the_report', () => {
    const report = ErrorReport.from({
      id: 'report-1',
      kind: 'invalid_message',
      message: 'something happened',
      source: 'router',
      severity: 'warning',
      occurredAt: REPORTED_AT,
    });

    expect(report.id).toBe('report-1');
  });

  it('should_keep_occurredAt_as_a_Date_in_the_domain_object', () => {
    const report = ErrorReport.from({
      id: 'report-1',
      kind: 'invalid_message',
      message: 'something happened',
      source: 'router',
      severity: 'warning',
      occurredAt: REPORTED_AT,
    });

    expect(report.occurredAt).toBeInstanceOf(Date);
    expect(report.occurredAt.toISOString()).toBe('2026-03-15T10:00:00.000Z');
  });

  it('should_isolate_occurredAt_from_caller_mutation_after_construction', () => {
    const mutable = new Date(REPORTED_AT);

    const report = ErrorReport.from({
      id: 'report-1',
      kind: 'invalid_message',
      message: 'something happened',
      source: 'router',
      severity: 'warning',
      occurredAt: mutable,
    });

    mutable.setFullYear(1999);
    expect(report.occurredAt.getFullYear()).toBe(2026);
  });

  it('should_carry_details_when_provided', () => {
    const report = ErrorReport.from({
      id: 'report-1',
      kind: 'invalid_message',
      message: 'something happened',
      source: 'router',
      severity: 'warning',
      occurredAt: REPORTED_AT,
      details: 'context line',
    });

    expect(report.details).toBe('context line');
  });

  it('should_omit_details_when_not_provided', () => {
    const report = ErrorReport.from({
      id: 'report-1',
      kind: 'invalid_message',
      message: 'something happened',
      source: 'router',
      severity: 'warning',
      occurredAt: REPORTED_AT,
    });

    expect(report.details).toBeUndefined();
  });

  it('should_throw_with_message_pointing_to_id_when_id_is_empty', () => {
    expect(() =>
      ErrorReport.from({
        id: '',
        kind: 'invalid_message',
        message: 'something happened',
        source: 'router',
        severity: 'warning',
        occurredAt: REPORTED_AT,
      }),
    ).toThrow(/id must not be empty/);
  });

  it('should_throw_with_message_pointing_to_id_when_id_is_whitespace_only', () => {
    expect(() =>
      ErrorReport.from({
        id: '   ',
        kind: 'invalid_message',
        message: 'something happened',
        source: 'router',
        severity: 'warning',
        occurredAt: REPORTED_AT,
      }),
    ).toThrow(/id must not be empty/);
  });

  it('should_throw_with_message_pointing_to_message_when_message_is_empty', () => {
    expect(() =>
      ErrorReport.from({
        id: 'report-1',
        kind: 'invalid_message',
        message: '',
        source: 'router',
        severity: 'warning',
        occurredAt: REPORTED_AT,
      }),
    ).toThrow(/message must not be empty/);
  });

  it('should_throw_InvalidErrorReport_when_message_is_whitespace_only', () => {
    expect(() =>
      ErrorReport.from({
        id: 'report-1',
        kind: 'invalid_message',
        message: '   ',
        source: 'router',
        severity: 'warning',
        occurredAt: REPORTED_AT,
      }),
    ).toThrow(InvalidErrorReport);
  });
});

describe('ErrorReport.toSnapshot', () => {
  it('should_render_occurredAt_as_iso_string_in_the_snapshot', () => {
    const report = ErrorReport.from({
      id: 'report-1',
      kind: 'invalid_message',
      message: 'something happened',
      source: 'router',
      severity: 'warning',
      occurredAt: REPORTED_AT,
    });

    expect(report.toSnapshot().occurredAt).toBe('2026-03-15T10:00:00.000Z');
  });

  it('should_omit_details_from_the_snapshot_when_absent', () => {
    const report = ErrorReport.from({
      id: 'report-1',
      kind: 'invalid_message',
      message: 'something happened',
      source: 'router',
      severity: 'warning',
      occurredAt: REPORTED_AT,
    });

    expect('details' in report.toSnapshot()).toBe(false);
  });

  it('should_carry_details_into_the_snapshot_when_provided', () => {
    const report = ErrorReport.from({
      id: 'report-1',
      kind: 'invalid_message',
      message: 'something happened',
      source: 'router',
      severity: 'warning',
      occurredAt: REPORTED_AT,
      details: 'context line',
    });

    expect(report.toSnapshot().details).toBe('context line');
  });
});

describe('ErrorReport.fromSnapshot', () => {
  it('should_round_trip_a_snapshot_back_to_an_equivalent_ErrorReport', () => {
    const original = ErrorReport.from({
      id: 'report-1',
      kind: 'invalid_message',
      message: 'something happened',
      source: 'router',
      severity: 'warning',
      occurredAt: REPORTED_AT,
      details: 'context line',
    });

    const round = ErrorReport.fromSnapshot(original.toSnapshot());

    expect(round.toSnapshot()).toEqual(original.toSnapshot());
  });

  it('should_parse_iso_occurredAt_back_into_a_Date', () => {
    const snapshot: ErrorReportSnapshot = {
      id: 'report-1',
      kind: 'invalid_message',
      message: 'something happened',
      source: 'router',
      severity: 'warning',
      occurredAt: '2026-03-15T10:00:00.000Z',
    };

    const report = ErrorReport.fromSnapshot(snapshot);

    expect(report.occurredAt).toBeInstanceOf(Date);
    expect(report.occurredAt.toISOString()).toBe('2026-03-15T10:00:00.000Z');
  });
});
