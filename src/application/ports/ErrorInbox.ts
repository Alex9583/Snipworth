import type { ErrorReport } from '@/domain/error-reporting/ErrorReport';

export type InboxRead =
  | { readonly kind: 'loaded'; readonly errors: readonly ErrorReport[] }
  | { readonly kind: 'inbox_unavailable'; readonly cause: unknown };

export type AckOutcome =
  | { readonly kind: 'acknowledged' }
  | { readonly kind: 'inbox_unavailable'; readonly cause: unknown };

export interface InboxReader {
  list(): Promise<InboxRead>;
}

export interface InboxAcknowledger {
  acknowledge(ids: readonly string[]): Promise<AckOutcome>;
}

export interface ErrorInbox extends InboxReader, InboxAcknowledger {}
