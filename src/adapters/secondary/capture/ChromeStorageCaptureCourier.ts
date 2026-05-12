import type { CaptureCourier, DeliverCaptureOutcome } from '@/application/ports/CaptureCourier';
import type { CapturedSelection } from '@/domain/capture/CapturedSelection';
import { PENDING_CAPTURE_KEY } from './pendingCaptureKey';
import type { PendingCaptureSnapshot } from './pendingCaptureSnapshot';

export class ChromeStorageCaptureCourier implements CaptureCourier {
  async deliver(selection: CapturedSelection): Promise<DeliverCaptureOutcome> {
    const snapshot: PendingCaptureSnapshot = {
      code: selection.code,
      sourceUrl: selection.sourceUrl ?? null,
    };
    try {
      await chrome.storage.session.set({ [PENDING_CAPTURE_KEY]: snapshot });
      return { kind: 'delivered' };
    } catch (cause) {
      return { kind: 'storage_failed', cause };
    }
  }
}
