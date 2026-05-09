import { describe, it, expect, beforeEach } from 'vitest';
import {
  queueSidePanelFault,
  queueStorageFault,
  readSession,
  readSidePanelOpens,
  resetChromeMock,
} from '../../../setup/chrome-mock';
import { ChromeStorageCaptureCourier } from '@/adapters/secondary/capture/ChromeStorageCaptureCourier';
import { PENDING_CAPTURE_KEY } from '@/adapters/secondary/capture/pendingCaptureKey';
import { CapturedSelection } from '@/domain/capture/CapturedSelection';

beforeEach(() => {
  resetChromeMock();
});

describe('ChromeStorageCaptureCourier', () => {
  it('should_write_a_pending_capture_snapshot_to_session_storage_when_delivering', async () => {
    const courier = new ChromeStorageCaptureCourier();

    const outcome = await courier.deliver(
      CapturedSelection.from({
        code: 'const x = 1;',
        sourceUrl: 'https://example.com/page',
      }),
      { tabId: 7 },
    );

    expect(outcome).toEqual({ kind: 'delivered' });
    expect(readSession(PENDING_CAPTURE_KEY)).toEqual({
      code: 'const x = 1;',
      sourceUrl: 'https://example.com/page',
    });
  });

  it('should_normalise_a_missing_source_url_to_null_in_storage', async () => {
    const courier = new ChromeStorageCaptureCourier();

    await courier.deliver(CapturedSelection.from({ code: 'a', sourceUrl: undefined }), {
      tabId: 7,
    });

    expect(readSession(PENDING_CAPTURE_KEY)).toEqual({ code: 'a', sourceUrl: null });
  });

  it('should_open_the_side_panel_synchronously_to_preserve_the_user_gesture', async () => {
    let releaseStorage!: () => void;
    const storagePending = new Promise<void>((resolve) => {
      releaseStorage = resolve;
    });
    chrome.storage.session.set = () => storagePending;

    const courier = new ChromeStorageCaptureCourier();
    const deliveryPromise = courier.deliver(
      CapturedSelection.from({ code: 'a', sourceUrl: undefined }),
      { tabId: 42 },
    );

    await Promise.resolve();
    expect(readSidePanelOpens()).toEqual([{ tabId: 42 }]);

    releaseStorage();
    const outcome = await deliveryPromise;

    expect(outcome).toEqual({ kind: 'delivered' });
  });

  it('should_open_the_side_panel_synchronously_even_when_storage_write_fails', async () => {
    let rejectStorage!: (cause: unknown) => void;
    const storagePending = new Promise<void>((_, reject) => {
      rejectStorage = reject;
    });
    chrome.storage.session.set = () => storagePending;

    const courier = new ChromeStorageCaptureCourier();
    const deliveryPromise = courier.deliver(
      CapturedSelection.from({ code: 'a', sourceUrl: undefined }),
      { tabId: 9 },
    );

    await Promise.resolve();
    expect(readSidePanelOpens()).toEqual([{ tabId: 9 }]);

    const cause = new Error('boom');
    rejectStorage(cause);
    const outcome = await deliveryPromise;

    expect(outcome).toEqual({ kind: 'storage_failed', cause });
  });

  it('should_return_storage_failed_with_cause_when_session_storage_set_rejects', async () => {
    const cause = new Error('quota exceeded');
    queueStorageFault({ area: 'session', op: 'set', cause });
    const courier = new ChromeStorageCaptureCourier();

    const outcome = await courier.deliver(
      CapturedSelection.from({ code: 'a', sourceUrl: undefined }),
      { tabId: 1 },
    );

    expect(outcome).toEqual({ kind: 'storage_failed', cause });
  });

  it('should_return_panel_open_failed_with_cause_when_side_panel_open_rejects', async () => {
    const cause = new Error('no such tab');
    queueSidePanelFault({ op: 'open', cause });
    const courier = new ChromeStorageCaptureCourier();

    const outcome = await courier.deliver(
      CapturedSelection.from({ code: 'a', sourceUrl: undefined }),
      { tabId: 1 },
    );

    expect(outcome).toEqual({ kind: 'panel_open_failed', cause });
  });

  it('should_report_storage_failed_when_both_storage_and_side_panel_fail', async () => {
    const storageCause = new Error('quota exceeded');
    const panelCause = new Error('no such tab');
    queueStorageFault({ area: 'session', op: 'set', cause: storageCause });
    queueSidePanelFault({ op: 'open', cause: panelCause });
    const courier = new ChromeStorageCaptureCourier();

    const outcome = await courier.deliver(
      CapturedSelection.from({ code: 'a', sourceUrl: undefined }),
      { tabId: 9 },
    );

    expect(outcome).toEqual({ kind: 'storage_failed', cause: storageCause });
  });
});
