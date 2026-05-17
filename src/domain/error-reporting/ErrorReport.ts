export const errorKinds = [
  'side_panel_setup_failed',
  'invalid_message',
  'error_inbox_corrupt',
  'handler_crashed',
  'badge_unavailable',
  'context_menu_install_failed',
  'capture_storage_failed',
  'capture_panel_open_failed',
  'preferences_load_failed',
  'preferences_save_failed',
  'snippet_export_failed',
  'open_full_tab_failed',
] as const;

export type ErrorKind = (typeof errorKinds)[number];

export const errorSources = ['background', 'router', 'side_panel'] as const;

export type ErrorSource = (typeof errorSources)[number];

export const errorSeverities = ['warning', 'error'] as const;

export type ErrorSeverity = (typeof errorSeverities)[number];

import { ReportId } from '@/domain/error-reporting/ReportId';

export class InvalidErrorReport extends Error {
  constructor(reason: string) {
    super(`InvalidErrorReport: ${reason}`);
    this.name = 'InvalidErrorReport';
  }
}

const fail = (reason: string): never => {
  throw new InvalidErrorReport(reason);
};

export interface ErrorReportInput {
  readonly id: string;
  readonly kind: ErrorKind;
  readonly message: string;
  readonly occurredAt: Date;
  readonly source: ErrorSource;
  readonly severity: ErrorSeverity;
  readonly details?: string;
}

export interface ErrorReportSnapshot {
  readonly id: string;
  readonly kind: ErrorKind;
  readonly message: string;
  readonly occurredAt: string;
  readonly source: ErrorSource;
  readonly severity: ErrorSeverity;
  readonly details?: string;
}

interface ErrorReportProps {
  readonly id: ReportId;
  readonly kind: ErrorKind;
  readonly message: string;
  readonly occurredAt: Date;
  readonly source: ErrorSource;
  readonly severity: ErrorSeverity;
  readonly details: string | undefined;
}

export class ErrorReport {
  readonly id: ReportId;
  readonly kind: ErrorKind;
  readonly message: string;
  readonly occurredAt: Date;
  readonly source: ErrorSource;
  readonly severity: ErrorSeverity;
  readonly details: string | undefined;

  private constructor(props: ErrorReportProps) {
    this.id = props.id;
    this.kind = props.kind;
    this.message = props.message;
    this.occurredAt = props.occurredAt;
    this.source = props.source;
    this.severity = props.severity;
    this.details = props.details;
  }

  static from(input: ErrorReportInput): ErrorReport {
    const id = ReportId.from(input.id, fail);
    if (input.message.trim().length === 0) {
      throw new InvalidErrorReport('message must not be empty');
    }
    return new ErrorReport({
      id,
      kind: input.kind,
      message: input.message,
      occurredAt: new Date(input.occurredAt.getTime()),
      source: input.source,
      severity: input.severity,
      details: input.details,
    });
  }

  static fromSnapshot(snapshot: ErrorReportSnapshot): ErrorReport {
    return new ErrorReport({
      id: ReportId.from(snapshot.id, fail),
      kind: snapshot.kind,
      message: snapshot.message,
      occurredAt: new Date(snapshot.occurredAt),
      source: snapshot.source,
      severity: snapshot.severity,
      details: snapshot.details,
    });
  }

  toSnapshot(): ErrorReportSnapshot {
    const base: ErrorReportSnapshot = {
      id: this.id,
      kind: this.kind,
      message: this.message,
      occurredAt: this.occurredAt.toISOString(),
      source: this.source,
      severity: this.severity,
    };
    return this.details === undefined ? base : { ...base, details: this.details };
  }
}
