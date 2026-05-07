import type { Snippet } from '@/domain/snippets/Snippet';
import type { SnippetId } from '@/domain/snippets/SnippetId';

export type SaveSnippetOutcome =
  | { readonly kind: 'saved' }
  | { readonly kind: 'storage_unavailable'; readonly cause: unknown };

export type FindSnippetOutcome =
  | { readonly kind: 'found'; readonly snippet: Snippet }
  | { readonly kind: 'not_found' }
  | { readonly kind: 'corrupt'; readonly cause: unknown }
  | { readonly kind: 'storage_unavailable'; readonly cause: unknown };

export interface CorruptSnippetRow {
  readonly id: string;
  readonly cause: unknown;
}

export interface SnippetFilter {
  readonly language?: string;
}

export type FindAllSnippetsOutcome =
  | {
      readonly kind: 'loaded';
      readonly snippets: readonly Snippet[];
      readonly corrupt: readonly CorruptSnippetRow[];
    }
  | { readonly kind: 'storage_unavailable'; readonly cause: unknown };

export type DeleteSnippetOutcome =
  | { readonly kind: 'deleted' }
  | { readonly kind: 'storage_unavailable'; readonly cause: unknown };

export interface SnippetRepository {
  save(snippet: Snippet): Promise<SaveSnippetOutcome>;
  findById(id: SnippetId): Promise<FindSnippetOutcome>;
  findAll(filter?: SnippetFilter): Promise<FindAllSnippetsOutcome>;
  delete(id: SnippetId): Promise<DeleteSnippetOutcome>;
}
