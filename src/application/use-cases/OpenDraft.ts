import type { DraftRepository } from '@/application/ports/DraftRepository';
import type { DraftSnapshot } from '@/domain/drafts/Draft';
import type { DraftId } from '@/domain/drafts/DraftId';
import { type DraftTransitionFailure, loadDraft } from './draftTransition';

export interface OpenDraftInput {
  readonly id: DraftId;
}

export type OpenDraftOutcome =
  | { readonly kind: 'found'; readonly snapshot: DraftSnapshot }
  | DraftTransitionFailure;

export class OpenDraft {
  constructor(private readonly repo: DraftRepository) {}

  async execute(input: OpenDraftInput): Promise<OpenDraftOutcome> {
    const loaded = await loadDraft(this.repo, input.id);
    if (!loaded.ok) return loaded.outcome;
    return { kind: 'found', snapshot: loaded.draft.toSnapshot() };
  }
}
