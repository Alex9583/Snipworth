import { describe, it, expect, beforeEach } from 'vitest';
import { queueRuntimeFault, resetChromeMock } from '../../setup/chrome-mock';
import { MessagingInboxAcknowledger } from '@/adapters/secondary/error-channel/MessagingInboxAcknowledger';

beforeEach(() => {
  resetChromeMock();
});

function respondTo(response: unknown): void {
  chrome.runtime.onMessage.addListener((_msg, _sender, sendResponse) => {
    sendResponse(response);
    return false;
  });
}

describe('MessagingInboxAcknowledger — acknowledge', () => {
  it('should_send_an_ACK_ERRORS_message_with_the_acknowledged_ids', async () => {
    const received: unknown[] = [];
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      received.push(msg);
      sendResponse({ ok: true });
      return false;
    });
    const acknowledger = new MessagingInboxAcknowledger();

    const outcome = await acknowledger.acknowledge(['id-1', 'id-2']);

    expect(outcome).toEqual({ kind: 'acknowledged' });
    expect(received).toEqual([{ type: 'ACK_ERRORS', acknowledgedIds: ['id-1', 'id-2'] }]);
  });

  it('should_return_inbox_unavailable_when_response_carries_inbox_unavailable_code', async () => {
    respondTo({
      ok: false,
      error: { code: 'inbox_unavailable', message: 'storage offline' },
    });
    const acknowledger = new MessagingInboxAcknowledger();

    const outcome = await acknowledger.acknowledge(['id-1']);

    expect(outcome.kind).toBe('inbox_unavailable');
    if (outcome.kind !== 'inbox_unavailable') return;
    expect(outcome.cause).toBeInstanceOf(Error);
    expect((outcome.cause as Error).message).toBe('storage offline');
  });

  it('should_return_background_failed_with_handler_crashed_code_when_message_handler_crashes', async () => {
    respondTo({
      ok: false,
      error: { code: 'handler_crashed', message: 'handler rejected' },
    });
    const acknowledger = new MessagingInboxAcknowledger();

    const outcome = await acknowledger.acknowledge(['id-1']);

    expect(outcome).toEqual({
      kind: 'background_failed',
      code: 'handler_crashed',
      message: 'handler rejected',
    });
  });

  it('should_return_background_failed_with_unauthorized_sender_code_when_sender_is_unauthorized', async () => {
    respondTo({
      ok: false,
      error: { code: 'unauthorized_sender', message: 'sender rejected' },
    });
    const acknowledger = new MessagingInboxAcknowledger();

    const outcome = await acknowledger.acknowledge(['id-1']);

    expect(outcome).toEqual({
      kind: 'background_failed',
      code: 'unauthorized_sender',
      message: 'sender rejected',
    });
  });

  it('should_return_background_failed_with_malformed_request_code_when_router_rejects_payload', async () => {
    respondTo({
      ok: false,
      error: { code: 'malformed_request', message: 'payload rejected' },
    });
    const acknowledger = new MessagingInboxAcknowledger();

    const outcome = await acknowledger.acknowledge(['id-1']);

    expect(outcome).toEqual({
      kind: 'background_failed',
      code: 'malformed_request',
      message: 'payload rejected',
    });
  });

  it('should_return_inbox_unavailable_when_sendMessage_rejects', async () => {
    const cause = new Error('worker missing');
    queueRuntimeFault({ op: 'sendMessage', cause });
    const acknowledger = new MessagingInboxAcknowledger();

    const outcome = await acknowledger.acknowledge(['id-1']);

    expect(outcome).toEqual({ kind: 'inbox_unavailable', cause });
  });

  it('should_return_inbox_unavailable_when_response_is_not_a_well_formed_envelope', async () => {
    respondTo('not-a-response');
    const acknowledger = new MessagingInboxAcknowledger();

    const outcome = await acknowledger.acknowledge(['id-1']);

    expect(outcome.kind).toBe('inbox_unavailable');
  });

  it('should_return_inbox_unavailable_when_response_is_ok_true_with_unexpected_data_field', async () => {
    respondTo({ ok: true, data: 'unexpected' });
    const acknowledger = new MessagingInboxAcknowledger();

    const outcome = await acknowledger.acknowledge(['id-1']);

    expect(outcome.kind).toBe('inbox_unavailable');
  });
});
