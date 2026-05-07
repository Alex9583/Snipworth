import { responseSchemaFor, type AckErrorsRequest } from '@/adapters/messaging';
import type { AckOutcome, InboxAcknowledger } from '@/application/ports/ErrorInbox';

export class MessagingInboxAcknowledger implements InboxAcknowledger {
  async acknowledge(ids: readonly string[]): Promise<AckOutcome> {
    const request: AckErrorsRequest = {
      type: 'ACK_ERRORS',
      acknowledgedIds: [...ids],
    };
    let rawResponse: unknown;
    try {
      rawResponse = await chrome.runtime.sendMessage(request);
    } catch (cause) {
      return { kind: 'inbox_unavailable', cause };
    }
    const parsed = responseSchemaFor.ACK_ERRORS.safeParse(rawResponse);
    if (!parsed.success) {
      return { kind: 'inbox_unavailable', cause: parsed.error };
    }
    if (parsed.data.ok) return { kind: 'acknowledged' };
    const { code, message } = parsed.data.error;
    if (code === 'inbox_unavailable') {
      return { kind: 'inbox_unavailable', cause: new Error(message) };
    }
    return { kind: 'background_failed', code, message };
  }
}
