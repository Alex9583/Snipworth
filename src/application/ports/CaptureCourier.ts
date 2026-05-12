import type { CapturedSelection } from '@/domain/capture/CapturedSelection';

export type DeliverCaptureOutcome =
  | { readonly kind: 'delivered' }
  | { readonly kind: 'storage_failed'; readonly cause: unknown };

export interface CaptureCourier {
  deliver(selection: CapturedSelection): Promise<DeliverCaptureOutcome>;
}
