import type { Clock } from '@/application/ports/Clock';
import type { DraftRepository } from '@/application/ports/DraftRepository';
import type { DraftId } from '@/domain/drafts/DraftId';
import { type DraftTransitionFailure, loadDraft, persistDraft } from './draftTransition';

export interface ArchiveDraftInput {
  readonly id: DraftId;
}

export type ArchiveDraftOutcome = { readonly kind: 'archived' } | DraftTransitionFailure;

export class ArchiveDraft {
  constructor(
    private readonly repo: DraftRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: ArchiveDraftInput): Promise<ArchiveDraftOutcome> {
    const loaded = await loadDraft(this.repo, input.id);
    if (!loaded.ok) return loaded.outcome;
    const archived = loaded.draft.archive(this.clock.now());
    return persistDraft(this.repo, archived, 'archived');
  }
}
