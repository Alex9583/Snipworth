import type { Draft } from '@/domain/drafts/Draft';
import type { DraftId } from '@/domain/drafts/DraftId';

export type SaveDraftOutcome =
  | { readonly kind: 'saved' }
  | { readonly kind: 'storage_unavailable'; readonly cause: unknown };

export type FindDraftOutcome =
  | { readonly kind: 'found'; readonly draft: Draft }
  | { readonly kind: 'not_found' }
  | { readonly kind: 'corrupt'; readonly cause: unknown }
  | { readonly kind: 'storage_unavailable'; readonly cause: unknown };

export interface CorruptDraftRow {
  readonly id: string;
  readonly cause: unknown;
}

export type FindAllDraftsOutcome =
  | {
      readonly kind: 'loaded';
      readonly drafts: readonly Draft[];
      readonly corrupt: readonly CorruptDraftRow[];
    }
  | { readonly kind: 'storage_unavailable'; readonly cause: unknown };

export type DeleteDraftOutcome =
  | { readonly kind: 'deleted' }
  | { readonly kind: 'storage_unavailable'; readonly cause: unknown };

export interface DraftRepository {
  save(draft: Draft): Promise<SaveDraftOutcome>;
  findById(id: DraftId): Promise<FindDraftOutcome>;
  findAll(): Promise<FindAllDraftsOutcome>;
  delete(id: DraftId): Promise<DeleteDraftOutcome>;
}
