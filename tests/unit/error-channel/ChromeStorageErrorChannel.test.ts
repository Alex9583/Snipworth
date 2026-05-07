import { describe, it, expect, beforeEach } from 'vitest';
import {
  queueActionFault,
  queueStorageFault,
  readBadge,
  resetChromeMock,
} from '../../setup/chrome-mock';
import { FakeClock } from '../../setup/fakes/FakeClock';
import { FixedIdGenerator } from '../../setup/fakes/FixedIdGenerator';
import { ChromeStorageErrorChannel } from '@/adapters/secondary/error-channel/ChromeStorageErrorChannel';
import { ErrorReport } from '@/domain/error-reporting/ErrorReport';

const REPORTED_AT = new Date('2026-01-01T00:00:00.000Z');

const aSetupError = ErrorReport.from({
  id: 'setup-1',
  kind: 'side_panel_setup_failed',
  message: 'Could not configure the side panel.',
  source: 'background',
  severity: 'error',
  occurredAt: REPORTED_AT,
  details: 'boom',
});

const anInvalidMessageError = ErrorReport.from({
  id: 'invalid-1',
  kind: 'invalid_message',
  message: 'Snipworth received a message it did not understand.',
  source: 'router',
  severity: 'warning',
  occurredAt: REPORTED_AT,
});

function makeChannel(clock = new FakeClock()) {
  return new ChromeStorageErrorChannel(clock, new FixedIdGenerator('marker'));
}

beforeEach(() => {
  resetChromeMock();
});

describe('ChromeStorageErrorChannel — report (ErrorReporter)', () => {
  it('should_persist_the_error_to_chrome_storage_local', async () => {
    const channel = makeChannel();

    const outcome = await channel.report(aSetupError);

    expect(outcome).toEqual({ kind: 'reported' });
    const stored = await chrome.storage.local.get(['pending_errors']);
    expect(stored.pending_errors).toEqual([aSetupError.toSnapshot()]);
  });

  it('should_append_to_existing_queue_without_overwriting_previous_errors', async () => {
    const channel = makeChannel();

    await channel.report(aSetupError);
    await channel.report(anInvalidMessageError);

    const stored = await chrome.storage.local.get(['pending_errors']);
    expect(stored.pending_errors).toEqual([
      aSetupError.toSnapshot(),
      anInvalidMessageError.toSnapshot(),
    ]);
  });

  it('should_show_a_warning_badge_on_the_action_icon', async () => {
    const channel = makeChannel();

    await channel.report(aSetupError);

    expect(readBadge().text).toBe('!');
    expect(readBadge().color).toBeTruthy();
  });

  it('should_not_drop_a_report_when_two_calls_run_concurrently', async () => {
    const channel = makeChannel();

    const [first, second] = await Promise.all([
      channel.report(aSetupError),
      channel.report(anInvalidMessageError),
    ]);

    expect(first).toEqual({ kind: 'reported' });
    expect(second).toEqual({ kind: 'reported' });
    const stored = await chrome.storage.local.get(['pending_errors']);
    expect(stored.pending_errors).toEqual([
      aSetupError.toSnapshot(),
      anInvalidMessageError.toSnapshot(),
    ]);
  });

  it('should_serialize_a_report_and_an_acknowledge_when_they_run_concurrently', async () => {
    const channel = makeChannel();
    await channel.report(aSetupError);

    const [reportOutcome, ackOutcome] = await Promise.all([
      channel.report(anInvalidMessageError),
      channel.acknowledge([aSetupError.id]),
    ]);

    expect(reportOutcome).toEqual({ kind: 'reported' });
    expect(ackOutcome).toEqual({ kind: 'acknowledged' });
    const stored = await chrome.storage.local.get(['pending_errors']);
    expect(stored.pending_errors).toEqual([anInvalidMessageError.toSnapshot()]);
  });

  it('should_return_reporter_failed_when_storage_set_rejects', async () => {
    const channel = makeChannel();
    const cause = new Error('quota exceeded');
    queueStorageFault({ area: 'local', op: 'set', cause });

    const outcome = await channel.report(aSetupError);

    expect(outcome).toEqual({ kind: 'reporter_failed', cause });
  });

  it('should_return_reporter_failed_when_storage_get_rejects_during_report', async () => {
    const channel = makeChannel();
    const cause = new Error('storage offline');
    queueStorageFault({ area: 'local', op: 'get', cause });

    const outcome = await channel.report(aSetupError);

    expect(outcome).toEqual({ kind: 'reporter_failed', cause });
  });

  it('should_keep_processing_subsequent_calls_after_a_failed_set', async () => {
    const channel = makeChannel();
    queueStorageFault({ area: 'local', op: 'set', cause: new Error('one-shot quota') });

    const failed = await channel.report(aSetupError);
    const second = await channel.report(anInvalidMessageError);

    expect(failed.kind).toBe('reporter_failed');
    expect(second).toEqual({ kind: 'reported' });
  });

  it('should_keep_processing_subsequent_calls_after_a_failed_get', async () => {
    const channel = makeChannel();
    queueStorageFault({ area: 'local', op: 'get', cause: new Error('one-shot offline') });

    const failed = await channel.report(aSetupError);
    const second = await channel.report(anInvalidMessageError);

    expect(failed.kind).toBe('reporter_failed');
    expect(second).toEqual({ kind: 'reported' });
    const stored = await chrome.storage.local.get(['pending_errors']);
    expect(stored.pending_errors).toEqual([anInvalidMessageError.toSnapshot()]);
  });

  it('should_return_reported_when_storage_succeeds_but_badge_set_text_rejects', async () => {
    const channel = makeChannel();
    queueActionFault({ op: 'setBadgeText', cause: new Error('badge api down') });

    const outcome = await channel.report(aSetupError);

    expect(outcome).toEqual({ kind: 'reported' });
  });

  it('should_persist_a_badge_unavailable_report_when_setBadgeText_rejects_after_a_successful_report', async () => {
    const clock = new FakeClock(new Date('2026-02-15T12:00:00.000Z'));
    const channel = makeChannel(clock);
    queueActionFault({ op: 'setBadgeText', cause: new Error('badge api down') });

    await channel.report(aSetupError);

    const stored = await chrome.storage.local.get(['pending_errors']);
    expect(stored.pending_errors).toHaveLength(2);
    expect((stored.pending_errors as { kind: string }[])[1]?.kind).toBe('badge_unavailable');
  });

  it('should_assign_an_injected_id_to_the_badge_unavailable_marker', async () => {
    const channel = makeChannel();
    queueActionFault({ op: 'setBadgeText', cause: new Error('badge api down') });

    await channel.report(aSetupError);

    const stored = await chrome.storage.local.get(['pending_errors']);
    expect((stored.pending_errors as { id: string }[])[1]?.id).toBe('marker-1');
  });

  it('should_persist_a_badge_unavailable_report_when_setBadgeBackgroundColor_rejects', async () => {
    const channel = makeChannel();
    queueActionFault({ op: 'setBadgeBackgroundColor', cause: new Error('color api down') });

    const outcome = await channel.report(aSetupError);

    expect(outcome).toEqual({ kind: 'reported' });
    const stored = await chrome.storage.local.get(['pending_errors']);
    expect((stored.pending_errors as { kind: string }[])[1]?.kind).toBe('badge_unavailable');
  });

  it('should_replace_corruption_with_marker_and_persist_new_error_when_storage_holds_garbage', async () => {
    await chrome.storage.local.set({ pending_errors: 'not an array' });
    const clock = new FakeClock(new Date('2026-02-15T12:00:00.000Z'));
    const channel = makeChannel(clock);

    await channel.report(aSetupError);

    const stored = await chrome.storage.local.get(['pending_errors']);
    expect(stored.pending_errors).toHaveLength(2);
    const queue = stored.pending_errors as { kind: string; occurredAt: string }[];
    expect(queue[0]?.kind).toBe('error_inbox_corrupt');
    expect(queue[0]?.occurredAt).toBe('2026-02-15T12:00:00.000Z');
    expect(queue[1]).toEqual(aSetupError.toSnapshot());
  });

  it('should_assign_an_injected_id_to_the_corruption_marker', async () => {
    await chrome.storage.local.set({ pending_errors: 'not an array' });
    const channel = makeChannel();

    await channel.report(aSetupError);

    const stored = await chrome.storage.local.get(['pending_errors']);
    expect((stored.pending_errors as { id: string }[])[0]?.id).toBe('marker-1');
  });
});

describe('ChromeStorageErrorChannel — queue cap', () => {
  it('should_keep_at_most_50_reports_in_the_queue', async () => {
    const channel = makeChannel();

    for (let i = 0; i < 52; i++) {
      await channel.report(
        ErrorReport.from({
          id: `error-${String(i)}`,
          kind: 'invalid_message',
          message: `Error ${String(i)}`,
          source: 'router',
          severity: 'warning',
          occurredAt: REPORTED_AT,
        }),
      );
    }

    const result = await channel.list();
    expect(result.kind).toBe('loaded');
    if (result.kind !== 'loaded') return;
    expect(result.errors).toHaveLength(50);
  });

  it('should_evict_the_oldest_reports_when_the_queue_overflows', async () => {
    const channel = makeChannel();

    for (let i = 0; i < 52; i++) {
      await channel.report(
        ErrorReport.from({
          id: `error-${String(i)}`,
          kind: 'invalid_message',
          message: `Error ${String(i)}`,
          source: 'router',
          severity: 'warning',
          occurredAt: REPORTED_AT,
        }),
      );
    }

    const result = await channel.list();
    if (result.kind !== 'loaded') throw new Error('expected loaded');
    expect(result.errors[0]?.message).toBe('Error 2');
    expect(result.errors[49]?.message).toBe('Error 51');
  });
});

describe('ChromeStorageErrorChannel — list (InboxReader)', () => {
  it('should_return_loaded_with_empty_array_when_no_errors_have_been_reported', async () => {
    const channel = makeChannel();

    const result = await channel.list();

    expect(result).toEqual({ kind: 'loaded', errors: [] });
  });

  it('should_return_loaded_with_persisted_errors_in_chronological_order', async () => {
    const channel = makeChannel();

    await channel.report(aSetupError);
    await channel.report(anInvalidMessageError);

    const result = await channel.list();
    expect(result.kind).toBe('loaded');
    if (result.kind !== 'loaded') return;
    expect(result.errors.map((e) => e.toSnapshot())).toEqual([
      aSetupError.toSnapshot(),
      anInvalidMessageError.toSnapshot(),
    ]);
  });

  it('should_replace_corrupt_storage_with_a_marker_and_return_it_as_loaded', async () => {
    await chrome.storage.local.set({ pending_errors: 'not an array' });
    const clock = new FakeClock(new Date('2026-02-15T12:00:00.000Z'));
    const channel = makeChannel(clock);

    const result = await channel.list();

    expect(result.kind).toBe('loaded');
    if (result.kind !== 'loaded') return;
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.kind).toBe('error_inbox_corrupt');

    const stored = await chrome.storage.local.get(['pending_errors']);
    expect((stored.pending_errors as { kind: string }[]).length).toBe(1);
    expect((stored.pending_errors as { kind: string }[])[0]?.kind).toBe('error_inbox_corrupt');
  });

  it('should_surface_inbox_unavailable_when_storage_get_rejects', async () => {
    const channel = makeChannel();
    const cause = new Error('storage offline');
    queueStorageFault({ area: 'local', op: 'get', cause });

    const result = await channel.list();

    expect(result).toEqual({ kind: 'inbox_unavailable', cause });
  });
});

describe('ChromeStorageErrorChannel — acknowledge (InboxAcknowledger)', () => {
  it('should_remove_only_the_acknowledged_ids_and_keep_newer_reports', async () => {
    const channel = makeChannel();
    await channel.report(aSetupError);
    await channel.report(anInvalidMessageError);

    const outcome = await channel.acknowledge([aSetupError.id]);

    expect(outcome).toEqual({ kind: 'acknowledged' });
    const result = await channel.list();
    if (result.kind !== 'loaded') throw new Error('expected loaded');
    expect(result.errors.map((e) => e.toSnapshot())).toEqual([anInvalidMessageError.toSnapshot()]);
  });

  it('should_drain_the_queue_when_all_ids_are_acknowledged', async () => {
    const channel = makeChannel();
    await channel.report(aSetupError);
    await channel.report(anInvalidMessageError);

    const outcome = await channel.acknowledge([aSetupError.id, anInvalidMessageError.id]);

    expect(outcome).toEqual({ kind: 'acknowledged' });
    const result = await channel.list();
    expect(result).toEqual({ kind: 'loaded', errors: [] });
    expect(readBadge().text).toBe('');
  });

  it('should_be_a_no_op_when_ids_match_no_pending_report', async () => {
    const channel = makeChannel();
    await channel.report(aSetupError);

    const outcome = await channel.acknowledge(['no-such-id']);

    expect(outcome).toEqual({ kind: 'acknowledged' });
    const result = await channel.list();
    if (result.kind !== 'loaded') throw new Error('expected loaded');
    expect(result.errors.map((e) => e.toSnapshot())).toEqual([aSetupError.toSnapshot()]);
  });

  it('should_keep_the_badge_when_some_reports_remain', async () => {
    const channel = makeChannel();
    await channel.report(aSetupError);
    await channel.report(anInvalidMessageError);

    await channel.acknowledge([aSetupError.id]);

    expect(readBadge().text).toBe('!');
  });

  it('should_persist_a_badge_unavailable_report_when_clearBadge_fails_on_drain', async () => {
    const channel = makeChannel();
    await channel.report(aSetupError);
    queueActionFault({ op: 'setBadgeText', cause: new Error('badge api down') });

    const outcome = await channel.acknowledge([aSetupError.id]);

    expect(outcome).toEqual({ kind: 'acknowledged' });
    const stored = await chrome.storage.local.get(['pending_errors']);
    expect(stored.pending_errors).toHaveLength(1);
    expect((stored.pending_errors as { kind: string }[])[0]?.kind).toBe('badge_unavailable');
  });

  it('should_surface_inbox_unavailable_when_storage_set_rejects_on_acknowledge', async () => {
    const channel = makeChannel();
    await channel.report(aSetupError);
    const cause = new Error('storage offline');
    queueStorageFault({ area: 'local', op: 'set', cause });

    const outcome = await channel.acknowledge([aSetupError.id]);

    expect(outcome).toEqual({ kind: 'inbox_unavailable', cause });
  });
});

describe('ChromeStorageErrorChannel — reconcile', () => {
  it('should_replace_corrupt_storage_with_a_marker_when_corruption_is_detected', async () => {
    await chrome.storage.local.set({ pending_errors: 'not an array' });
    const clock = new FakeClock(new Date('2026-02-15T12:00:00.000Z'));
    const channel = makeChannel(clock);

    const outcome = await channel.reconcile();

    expect(outcome).toEqual({ kind: 'reconciled' });
    const stored = await chrome.storage.local.get(['pending_errors']);
    expect(stored.pending_errors).toHaveLength(1);
    expect((stored.pending_errors as { kind: string }[])[0]?.kind).toBe('error_inbox_corrupt');
  });

  it('should_be_a_no_op_when_storage_is_empty', async () => {
    const channel = makeChannel();

    const outcome = await channel.reconcile();

    expect(outcome).toEqual({ kind: 'reconciled' });
    const stored = await chrome.storage.local.get(['pending_errors']);
    expect(stored.pending_errors).toBeUndefined();
  });

  it('should_keep_storage_unchanged_when_existing_errors_are_valid', async () => {
    const channel = makeChannel();
    await channel.report(aSetupError);
    const before = await chrome.storage.local.get(['pending_errors']);

    const outcome = await channel.reconcile();

    expect(outcome).toEqual({ kind: 'reconciled' });
    const after = await chrome.storage.local.get(['pending_errors']);
    expect(after.pending_errors).toEqual(before.pending_errors);
  });

  it('should_return_inbox_unavailable_when_storage_get_rejects', async () => {
    const channel = makeChannel();
    const cause = new Error('storage offline');
    queueStorageFault({ area: 'local', op: 'get', cause });

    const outcome = await channel.reconcile();

    expect(outcome).toEqual({ kind: 'inbox_unavailable', cause });
  });
});
