import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetChromeMock } from '../../setup/chrome-mock';
import { MessagingInboxAcknowledger } from '@/adapters/secondary/error-channel/MessagingInboxAcknowledger';

beforeEach(() => {
  resetChromeMock();
});

describe('MessagingInboxAcknowledger — acknowledge', () => {
  it('should_send_an_ACK_ERRORS_message_with_the_acknowledged_ids', async () => {
    const sendMessage = vi
      .spyOn(chrome.runtime, 'sendMessage')
      .mockResolvedValueOnce({ ok: true } as never);
    const acknowledger = new MessagingInboxAcknowledger();

    const outcome = await acknowledger.acknowledge(['id-1', 'id-2']);

    expect(outcome).toEqual({ kind: 'acknowledged' });
    expect(sendMessage).toHaveBeenCalledWith({
      type: 'ACK_ERRORS',
      acknowledgedIds: ['id-1', 'id-2'],
    });
  });

  it('should_return_inbox_unavailable_with_the_service_worker_error_when_response_is_ok_false', async () => {
    vi.spyOn(chrome.runtime, 'sendMessage').mockResolvedValueOnce({
      ok: false,
      error: 'inbox unavailable',
    } as never);
    const acknowledger = new MessagingInboxAcknowledger();

    const outcome = await acknowledger.acknowledge(['id-1']);

    expect(outcome.kind).toBe('inbox_unavailable');
    if (outcome.kind !== 'inbox_unavailable') return;
    expect(outcome.cause).toBeInstanceOf(Error);
    expect((outcome.cause as Error).message).toBe('inbox unavailable');
  });

  it('should_return_inbox_unavailable_when_sendMessage_rejects', async () => {
    const cause = new Error('worker missing');
    vi.spyOn(chrome.runtime, 'sendMessage').mockRejectedValueOnce(cause);
    const acknowledger = new MessagingInboxAcknowledger();

    const outcome = await acknowledger.acknowledge(['id-1']);

    expect(outcome).toEqual({ kind: 'inbox_unavailable', cause });
  });

  it('should_return_inbox_unavailable_when_response_is_not_a_well_formed_envelope', async () => {
    vi.spyOn(chrome.runtime, 'sendMessage').mockResolvedValueOnce('not-a-response' as never);
    const acknowledger = new MessagingInboxAcknowledger();

    const outcome = await acknowledger.acknowledge(['id-1']);

    expect(outcome.kind).toBe('inbox_unavailable');
  });

  it('should_return_inbox_unavailable_when_response_is_ok_true_with_unexpected_data_field', async () => {
    vi.spyOn(chrome.runtime, 'sendMessage').mockResolvedValueOnce({
      ok: true,
      data: 'unexpected',
    } as never);
    const acknowledger = new MessagingInboxAcknowledger();

    const outcome = await acknowledger.acknowledge(['id-1']);

    expect(outcome.kind).toBe('inbox_unavailable');
  });
});
