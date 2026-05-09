import type {
  CaptureCourier,
  CaptureDeliveryTarget,
  DeliverCaptureOutcome,
} from '@/application/ports/CaptureCourier';
import type { CapturedSelection } from '@/domain/capture/CapturedSelection';
import { PENDING_CAPTURE_KEY } from './pendingCaptureKey';
import type { PendingCaptureSnapshot } from './pendingCaptureSnapshot';

export class ChromeStorageCaptureCourier implements CaptureCourier {
  async deliver(
    selection: CapturedSelection,
    target: CaptureDeliveryTarget,
  ): Promise<DeliverCaptureOutcome> {
    const openAttempt = chrome.sidePanel.open({ tabId: target.tabId }).then(
      () => ({ ok: true }) as const,
      (cause: unknown) => ({ ok: false, cause }) as const,
    );
    const snapshot: PendingCaptureSnapshot = {
      code: selection.code,
      sourceUrl: selection.sourceUrl ?? null,
    };
    try {
      await chrome.storage.session.set({ [PENDING_CAPTURE_KEY]: snapshot });
    } catch (cause) {
      // Storage failure dominates a concurrent panel-open failure: the inbox
      // listens to storage, so without the snapshot the snippet is lost. A
      // panel-open failure is recoverable on the next subscribe; a missing
      // snapshot is not. We still await the open to settle the promise.
      await openAttempt;
      return { kind: 'storage_failed', cause };
    }
    const opened = await openAttempt;
    if (!opened.ok) {
      return { kind: 'panel_open_failed', cause: opened.cause };
    }
    return { kind: 'delivered' };
  }
}
