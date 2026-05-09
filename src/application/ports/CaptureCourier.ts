import type { CapturedSelection } from '@/domain/capture/CapturedSelection';

export interface CaptureDeliveryTarget {
  readonly tabId: number;
}

export type DeliverCaptureOutcome =
  | { readonly kind: 'delivered' }
  | { readonly kind: 'storage_failed'; readonly cause: unknown }
  | { readonly kind: 'panel_open_failed'; readonly cause: unknown };

export interface CaptureCourier {
  deliver(
    selection: CapturedSelection,
    target: CaptureDeliveryTarget,
  ): Promise<DeliverCaptureOutcome>;
}
