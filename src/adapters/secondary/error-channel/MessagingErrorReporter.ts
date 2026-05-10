import { responseSchemaFor, type ReportErrorRequest } from '@/adapters/messaging';
import type { ErrorReporter, ReportOutcome } from '@/application/ports/ErrorReporter';
import type { ErrorReport } from '@/domain/error-reporting/ErrorReport';

export class MessagingErrorReporter implements ErrorReporter {
  async report(error: ErrorReport): Promise<ReportOutcome> {
    const request: ReportErrorRequest = {
      type: 'REPORT_ERROR',
      report: error.toSnapshot(),
    };
    let rawResponse: unknown;
    try {
      rawResponse = await chrome.runtime.sendMessage(request);
    } catch (cause) {
      return { kind: 'reporter_failed', cause };
    }
    const parsed = responseSchemaFor.REPORT_ERROR.safeParse(rawResponse);
    if (!parsed.success) {
      return { kind: 'reporter_failed', cause: parsed.error };
    }
    if (parsed.data.ok) return { kind: 'reported' };
    return { kind: 'reporter_failed', cause: new Error(parsed.data.error.message) };
  }
}
