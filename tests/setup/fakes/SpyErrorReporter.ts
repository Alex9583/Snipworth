import type { ErrorReporter, ReportOutcome } from '@/application/ports/ErrorReporter';
import type { ErrorReport } from '@/domain/error-reporting/ErrorReport';

export class SpyErrorReporter implements ErrorReporter {
  readonly reports: ErrorReport[] = [];
  private outcome: ReportOutcome = { kind: 'reported' };

  report(error: ErrorReport): Promise<ReportOutcome> {
    this.reports.push(error);
    return Promise.resolve(this.outcome);
  }

  failNextReportWith(cause: unknown): void {
    this.outcome = { kind: 'reporter_failed', cause };
  }
}
