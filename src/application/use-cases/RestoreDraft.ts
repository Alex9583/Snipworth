import type { Clock } from '@/application/ports/Clock';
import type { DraftRepository } from '@/application/ports/DraftRepository';
import type { DraftId } from '@/domain/drafts/DraftId';
import { type DraftTransitionFailure, loadDraft, persistDraft } from './draftTransition';

export interface RestoreDraftInput {
  readonly id: DraftId;
}

export type RestoreDraftOutcome = { readonly kind: 'restored' } | DraftTransitionFailure;

export class RestoreDraft {
  constructor(
    private readonly repo: DraftRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: RestoreDraftInput): Promise<RestoreDraftOutcome> {
    const loaded = await loadDraft(this.repo, input.id);
    if (!loaded.ok) return loaded.outcome;
    const restored = loaded.draft.restore(this.clock.now());
    return persistDraft(this.repo, restored, 'restored');
  }
}
