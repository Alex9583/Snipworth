import type { ErrorReport } from '@/domain/error-reporting/ErrorReport';

export type ReportOutcome =
  | { readonly kind: 'reported' }
  | { readonly kind: 'reporter_failed'; readonly cause: unknown };

export interface ErrorReporter {
  report(error: ErrorReport): Promise<ReportOutcome>;
}
