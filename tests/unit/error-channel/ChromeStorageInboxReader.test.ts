import { describe, it, expect, beforeEach } from 'vitest';
import { queueStorageFault, resetChromeMock } from '../../setup/chrome-mock';
import { FakeClock } from '../../setup/fakes/FakeClock';
import { FixedIdGenerator } from '../../setup/fakes/FixedIdGenerator';
import { ChromeStorageInboxReader } from '@/adapters/secondary/error-channel/ChromeStorageInboxReader';
import { ErrorReport } from '@/domain/error-reporting/ErrorReport';

const REPORTED_AT = new Date('2026-01-01T00:00:00.000Z');

const aSetupError = ErrorReport.from({
  id: 'setup-1',
  kind: 'side_panel_setup_failed',
  message: 'Could not configure the side panel.',
  source: 'background',
  severity: 'error',
  occurredAt: REPORTED_AT,
});

function makeReader(clock = new FakeClock()) {
  return new ChromeStorageInboxReader(clock, new FixedIdGenerator('marker'));
}

beforeEach(() => {
  resetChromeMock();
});

describe('ChromeStorageInboxReader — list', () => {
  it('should_return_loaded_with_empty_array_when_storage_is_empty', async () => {
    const reader = makeReader();

    const result = await reader.list();

    expect(result).toEqual({ kind: 'loaded', errors: [] });
  });

  it('should_return_loaded_with_persisted_errors_when_storage_holds_a_valid_queue', async () => {
    await chrome.storage.local.set({ pending_errors: [aSetupError.toSnapshot()] });
    const reader = makeReader();

    const result = await reader.list();

    expect(result.kind).toBe('loaded');
    if (result.kind !== 'loaded') return;
    expect(result.errors.map((e) => e.toSnapshot())).toEqual([aSetupError.toSnapshot()]);
  });

  it('should_return_loaded_with_a_synthetic_marker_when_storage_is_corrupt', async () => {
    await chrome.storage.local.set({ pending_errors: 'not an array' });
    const clock = new FakeClock(new Date('2026-02-15T12:00:00.000Z'));
    const reader = makeReader(clock);

    const result = await reader.list();

    expect(result.kind).toBe('loaded');
    if (result.kind !== 'loaded') return;
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.kind).toBe('error_inbox_corrupt');
    expect(result.errors[0]?.severity).toBe('warning');
    expect(result.errors[0]?.occurredAt).toEqual(new Date('2026-02-15T12:00:00.000Z'));
    expect(result.errors[0]?.id).toBe('marker-1');
  });

  it('should_not_rewrite_storage_when_corruption_is_detected', async () => {
    await chrome.storage.local.set({ pending_errors: 'not an array' });
    const reader = makeReader();

    await reader.list();

    const stored = await chrome.storage.local.get(['pending_errors']);
    expect(stored.pending_errors).toBe('not an array');
  });

  it('should_return_loaded_with_a_synthetic_marker_when_one_report_in_the_queue_is_malformed', async () => {
    await chrome.storage.local.set({
      pending_errors: [aSetupError.toSnapshot(), { id: '', kind: 'invalid', message: '' }],
    });
    const reader = makeReader();

    const result = await reader.list();

    expect(result.kind).toBe('loaded');
    if (result.kind !== 'loaded') return;
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.kind).toBe('error_inbox_corrupt');
  });

  it('should_surface_inbox_unavailable_when_chrome_storage_get_rejects', async () => {
    const cause = new Error('storage offline');
    queueStorageFault({ area: 'local', op: 'get', cause });
    const reader = makeReader();

    const result = await reader.list();

    expect(result).toEqual({ kind: 'inbox_unavailable', cause });
  });
});
