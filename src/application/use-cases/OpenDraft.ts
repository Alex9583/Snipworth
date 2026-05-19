import type { DraftRepository, FindDraftOutcome } from '@/application/ports/DraftRepository';
import type { DraftSnapshot } from '@/domain/drafts/Draft';
import type { DraftId } from '@/domain/drafts/DraftId';

export interface OpenDraftInput {
  readonly id: DraftId;
}

export type OpenDraftOutcome =
  | { readonly kind: 'found'; readonly snapshot: DraftSnapshot }
  | { readonly kind: 'not_found' }
  | { readonly kind: 'corrupt'; readonly cause: unknown }
  | { readonly kind: 'storage_unavailable'; readonly cause: unknown };

export class OpenDraft {
  constructor(private readonly repo: DraftRepository) {}

  async execute(input: OpenDraftInput): Promise<OpenDraftOutcome> {
    let outcome: FindDraftOutcome;
    try {
      outcome = await this.repo.findById(input.id);
    } catch (cause) {
      return { kind: 'storage_unavailable', cause };
    }
    switch (outcome.kind) {
      case 'found':
        return { kind: 'found', snapshot: outcome.draft.toSnapshot() };
      case 'not_found':
        return { kind: 'not_found' };
      case 'corrupt':
        return { kind: 'corrupt', cause: outcome.cause };
      case 'storage_unavailable':
        return { kind: 'storage_unavailable', cause: outcome.cause };
    }
  }
}
