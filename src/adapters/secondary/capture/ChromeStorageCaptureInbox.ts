import type { CaptureHandler, CaptureInbox, Unsubscribe } from '@/application/ports/CaptureInbox';
import { CapturedSelection } from '@/domain/capture/CapturedSelection';
import { PENDING_CAPTURE_KEY } from './pendingCaptureKey';
import { parsePendingCaptureSnapshot } from './pendingCaptureSnapshot';

type StorageChange = chrome.storage.StorageChange;

export class ChromeStorageCaptureInbox implements CaptureInbox {
  private chain: Promise<unknown> = Promise.resolve();

  subscribe(handler: CaptureHandler): Unsubscribe {
    const listener = (changes: Record<string, StorageChange>, areaName: string): void => {
      if (areaName !== 'session') return;
      const change = changes[PENDING_CAPTURE_KEY];
      if (change === undefined) return;
      if (toCapturedSelection(change.newValue) === undefined) return;
      void this.consumePending(handler);
    };
    chrome.storage.onChanged.addListener(listener);
    void this.consumePending(handler);
    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }

  private consumePending(handler: CaptureHandler): Promise<void> {
    return this.serialize(async () => {
      const stored = await chrome.storage.session.get([PENDING_CAPTURE_KEY]);
      const selection = toCapturedSelection(stored[PENDING_CAPTURE_KEY]);
      if (selection === undefined) return;
      await chrome.storage.session.remove([PENDING_CAPTURE_KEY]);
      handler(selection);
    });
  }

  private serialize<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.chain.then(fn, fn);
    this.chain = next.catch(() => undefined);
    return next;
  }
}

function toCapturedSelection(raw: unknown): CapturedSelection | undefined {
  const parsed = parsePendingCaptureSnapshot(raw);
  if (parsed === undefined) return undefined;
  if (parsed.code.length === 0) return undefined;
  return CapturedSelection.from({
    code: parsed.code,
    sourceUrl: parsed.sourceUrl ?? undefined,
  });
}
