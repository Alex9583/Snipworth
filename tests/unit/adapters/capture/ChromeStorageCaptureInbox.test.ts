import { describe, it, expect, beforeEach } from 'vitest';
import { resetChromeMock } from '../../../setup/chrome-mock';
import { ChromeStorageCaptureInbox } from '@/adapters/secondary/capture/ChromeStorageCaptureInbox';
import { PENDING_CAPTURE_KEY } from '@/adapters/secondary/capture/pendingCaptureKey';
import type { CapturedSelection } from '@/domain/capture/CapturedSelection';

beforeEach(() => {
  resetChromeMock();
});

async function flushAsync(): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

async function captureNext(inbox: ChromeStorageCaptureInbox): Promise<CapturedSelection[]> {
  const received: CapturedSelection[] = [];
  inbox.subscribe((selection) => {
    received.push(selection);
  });
  await flushAsync();
  return received;
}

describe('ChromeStorageCaptureInbox', () => {
  it('should_emit_the_pending_capture_when_one_already_exists_at_subscribe_time', async () => {
    await chrome.storage.session.set({
      [PENDING_CAPTURE_KEY]: { code: 'const x = 1;', sourceUrl: 'https://example.com/page' },
    });
    const inbox = new ChromeStorageCaptureInbox();

    const received = await captureNext(inbox);

    expect(received.map((s) => s.toSnapshot())).toEqual([
      { code: 'const x = 1;', sourceUrl: 'https://example.com/page' },
    ]);
  });

  it('should_normalise_a_null_source_url_to_undefined_in_the_emitted_capture', async () => {
    await chrome.storage.session.set({
      [PENDING_CAPTURE_KEY]: { code: 'a', sourceUrl: null },
    });
    const inbox = new ChromeStorageCaptureInbox();

    const received = await captureNext(inbox);

    expect(received.map((s) => s.toSnapshot())).toEqual([{ code: 'a', sourceUrl: undefined }]);
  });

  it('should_clear_the_pending_capture_after_emission', async () => {
    await chrome.storage.session.set({
      [PENDING_CAPTURE_KEY]: { code: 'a', sourceUrl: null },
    });
    const inbox = new ChromeStorageCaptureInbox();

    await captureNext(inbox);

    const stored = await chrome.storage.session.get([PENDING_CAPTURE_KEY]);
    expect(stored[PENDING_CAPTURE_KEY]).toBeUndefined();
  });

  it('should_emit_the_capture_when_a_session_change_arrives_after_subscribe', async () => {
    const inbox = new ChromeStorageCaptureInbox();
    const received: CapturedSelection[] = [];
    inbox.subscribe((selection) => {
      received.push(selection);
    });
    await flushAsync();

    await chrome.storage.session.set({
      [PENDING_CAPTURE_KEY]: { code: 'b', sourceUrl: 'https://example.org/x' },
    });
    await flushAsync();

    expect(received.map((s) => s.toSnapshot())).toEqual([
      { code: 'b', sourceUrl: 'https://example.org/x' },
    ]);
  });

  it('should_ignore_changes_to_storage_areas_other_than_session', async () => {
    const inbox = new ChromeStorageCaptureInbox();
    const received: CapturedSelection[] = [];
    inbox.subscribe((selection) => {
      received.push(selection);
    });
    await flushAsync();

    await chrome.storage.local.set({
      [PENDING_CAPTURE_KEY]: { code: 'b', sourceUrl: null },
    });
    await flushAsync();

    expect(received).toEqual([]);
  });

  it('should_ignore_change_events_whose_new_value_is_not_a_valid_snapshot', async () => {
    const inbox = new ChromeStorageCaptureInbox();
    const received: CapturedSelection[] = [];
    inbox.subscribe((selection) => {
      received.push(selection);
    });
    await flushAsync();

    await chrome.storage.session.set({ [PENDING_CAPTURE_KEY]: 'not an object' });
    await flushAsync();

    expect(received).toEqual([]);
  });

  it('should_ignore_storage_snapshots_whose_code_is_empty', async () => {
    await chrome.storage.session.set({
      [PENDING_CAPTURE_KEY]: { code: '', sourceUrl: null },
    });
    const inbox = new ChromeStorageCaptureInbox();

    const received = await captureNext(inbox);

    expect(received).toEqual([]);
  });

  it('should_emit_only_once_when_an_existing_pending_capture_races_with_a_session_change', async () => {
    await chrome.storage.session.set({
      [PENDING_CAPTURE_KEY]: { code: 'const x = 1;', sourceUrl: 'https://example.com/page' },
    });
    const inbox = new ChromeStorageCaptureInbox();
    const received: CapturedSelection[] = [];

    inbox.subscribe((selection) => {
      received.push(selection);
    });
    await chrome.storage.session.set({
      [PENDING_CAPTURE_KEY]: { code: 'const x = 1;', sourceUrl: 'https://example.com/page' },
    });
    await flushAsync();
    await flushAsync();

    expect(received.map((s) => s.toSnapshot())).toEqual([
      { code: 'const x = 1;', sourceUrl: 'https://example.com/page' },
    ]);
  });

  it('should_stop_emitting_after_unsubscribe_is_called', async () => {
    const inbox = new ChromeStorageCaptureInbox();
    const received: CapturedSelection[] = [];
    const unsubscribe = inbox.subscribe((selection) => {
      received.push(selection);
    });
    await flushAsync();
    unsubscribe();

    await chrome.storage.session.set({
      [PENDING_CAPTURE_KEY]: { code: 'b', sourceUrl: null },
    });
    await flushAsync();

    expect(received).toEqual([]);
  });
});
