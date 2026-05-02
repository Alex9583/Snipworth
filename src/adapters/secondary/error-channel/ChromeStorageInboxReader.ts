import type { InboxRead, InboxReader } from '@/application/ports/ErrorInbox';
import { ErrorReport } from '@/domain/error-reporting/ErrorReport';
import { PENDING_ERRORS_KEY, pendingErrorsSchema } from './storage-format';

export class ChromeStorageInboxReader implements InboxReader {
  async list(): Promise<InboxRead> {
    let raw: Record<string, unknown>;
    try {
      raw = await chrome.storage.local.get([PENDING_ERRORS_KEY]);
    } catch (cause) {
      return { kind: 'inbox_unavailable', cause };
    }
    const stored: unknown = raw[PENDING_ERRORS_KEY];
    if (stored === undefined) return { kind: 'loaded', errors: [] };
    const parsed = pendingErrorsSchema.safeParse(stored);
    if (parsed.success) {
      return {
        kind: 'loaded',
        errors: parsed.data.map((s) => ErrorReport.fromSnapshot(s)),
      };
    }
    return { kind: 'inbox_unavailable', cause: parsed.error };
  }
}
