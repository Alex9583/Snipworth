import type { Clock } from '@/application/ports/Clock';
import type { ErrorReporter, ReportOutcome } from '@/application/ports/ErrorReporter';
import type { IdGenerator } from '@/application/ports/IdGenerator';
import {
  ErrorReport,
  type ErrorKind,
  type ErrorSeverity,
} from '@/domain/error-reporting/ErrorReport';
import { describeCause } from '@/domain/error-reporting/describeCause';
import { ERROR_DETAILS_MAX } from '@/domain/limits';

export interface ReportSidePanelFailureCommand {
  readonly kind: ErrorKind;
  readonly message: string;
  readonly cause?: unknown;
  readonly severity?: ErrorSeverity;
}

export class ReportSidePanelFailure {
  constructor(
    private readonly reporter: ErrorReporter,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(command: ReportSidePanelFailureCommand): Promise<ReportOutcome> {
    const report = ErrorReport.from({
      id: this.ids.next(),
      kind: command.kind,
      message: command.message,
      occurredAt: this.clock.now(),
      source: 'side_panel',
      severity: command.severity ?? 'warning',
      details:
        command.cause === undefined
          ? undefined
          : describeCause(command.cause).slice(0, ERROR_DETAILS_MAX),
    });
    return this.reporter.report(report);
  }
}
