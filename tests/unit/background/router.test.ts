import { describe, it, expect } from 'vitest';
import { route } from '@/adapters/primary/background/router';
import type { AckOutcome, InboxAcknowledger } from '@/application/ports/ErrorInbox';
import { FakeClock } from '../../setup/fakes/FakeClock';
import { FixedIdGenerator } from '../../setup/fakes/FixedIdGenerator';

class FakeInboxAcknowledger implements InboxAcknowledger {
  readonly calls: (readonly string[])[] = [];
  private outcome: AckOutcome = { kind: 'acknowledged' };

  acknowledge(ids: readonly string[]): Promise<AckOutcome> {
    this.calls.push([...ids]);
    return Promise.resolve(this.outcome);
  }

  failNextAcknowledgeWith(cause: unknown): void {
    this.outcome = { kind: 'inbox_unavailable', cause };
  }
}

function makeDeps() {
  return {
    clock: new FakeClock(),
    ids: new FixedIdGenerator('router'),
    inboxAcknowledger: new FakeInboxAcknowledger(),
  };
}

describe('router — PING', () => {
  it('should_respond_with_pong_when_message_type_is_PING', async () => {
    const deps = makeDeps();

    const result = await route({ type: 'PING' }, deps);

    expect(result).toEqual({ response: { ok: true, data: 'pong' } });
  });

  it('should_not_emit_an_error_report_for_a_valid_PING', async () => {
    const deps = makeDeps();

    const result = await route({ type: 'PING' }, deps);

    expect(result.errorReport).toBeUndefined();
  });
});

describe('router — invalid messages', () => {
  it('should_respond_with_malformed_error_when_payload_is_null', async () => {
    const deps = makeDeps();

    const result = await route(null, deps);

    expect(result.response).toEqual({
      ok: false,
      error: {
        code: 'malformed_request',
        message: 'Snipworth received a message it did not understand.',
      },
    });
  });

  it('should_respond_with_malformed_error_when_message_type_is_unknown', async () => {
    const deps = makeDeps();

    const result = await route({ type: 'WHATEVER' }, deps);

    expect(result.response).toEqual({
      ok: false,
      error: {
        code: 'malformed_request',
        message: 'Snipworth received a message it did not understand.',
      },
    });
  });

  it('should_respond_with_malformed_error_when_LOAD_CODE_arrives_at_background', async () => {
    const deps = makeDeps();

    const result = await route({ type: 'LOAD_CODE', code: 'x' }, deps);

    expect(result.response).toEqual({
      ok: false,
      error: {
        code: 'malformed_request',
        message: 'Snipworth received a message it did not understand.',
      },
    });
  });

  it('should_emit_an_invalid_message_error_report_with_the_canonical_user_facing_message', async () => {
    const deps = makeDeps();

    const result = await route({ type: 'WHATEVER' }, deps);

    expect(result.errorReport?.kind).toBe('invalid_message');
    expect(result.errorReport?.source).toBe('router');
    expect(result.errorReport?.severity).toBe('warning');
    expect(result.errorReport?.message).toBe('Snipworth received a message it did not understand.');
  });

  it('should_carry_zod_path_information_in_the_emitted_error_report_details', async () => {
    const deps = makeDeps();

    const result = await route({ type: 'WHATEVER' }, deps);

    expect(result.errorReport?.details).toContain('"path"');
  });

  it('should_truncate_invalid_message_details_when_payload_is_huge', async () => {
    const deps = makeDeps();
    const huge = { type: 'WHATEVER', noise: 'a'.repeat(100_000) };

    const result = await route(huge, deps);

    expect(result.errorReport?.details?.length).toBeLessThanOrEqual(1000);
  });

  it('should_assign_a_fresh_id_to_the_emitted_error_report', async () => {
    const deps = makeDeps();

    const result = await route({ type: 'WHATEVER' }, deps);

    expect(result.errorReport?.id).toBe('router-1');
  });
});

describe('router — ACK_ERRORS', () => {
  it('should_forward_acknowledged_ids_to_the_acknowledger', async () => {
    const deps = makeDeps();

    await route({ type: 'ACK_ERRORS', acknowledgedIds: ['report-1', 'report-2'] }, deps);

    expect(deps.inboxAcknowledger.calls).toEqual([['report-1', 'report-2']]);
  });

  it('should_respond_ok_when_acknowledge_succeeds', async () => {
    const deps = makeDeps();

    const result = await route({ type: 'ACK_ERRORS', acknowledgedIds: [] }, deps);

    expect(result).toEqual({ response: { ok: true } });
  });

  it('should_respond_inbox_unavailable_when_acknowledge_fails', async () => {
    const deps = makeDeps();
    deps.inboxAcknowledger.failNextAcknowledgeWith(new Error('storage offline'));

    const result = await route({ type: 'ACK_ERRORS', acknowledgedIds: ['x'] }, deps);

    expect(result.response).toEqual({
      ok: false,
      error: {
        code: 'inbox_unavailable',
        message: 'Snipworth could not access its pending error inbox.',
      },
    });
  });

  it('should_not_emit_an_error_report_for_a_valid_ACK_ERRORS', async () => {
    const deps = makeDeps();

    const result = await route({ type: 'ACK_ERRORS', acknowledgedIds: ['x'] }, deps);

    expect(result.errorReport).toBeUndefined();
  });
});
