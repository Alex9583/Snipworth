import type { Clock } from '@/application/ports/Clock';
import type {
  DraftRepository,
  FindDraftOutcome,
  SaveDraftOutcome,
} from '@/application/ports/DraftRepository';
import type { Draft } from '@/domain/drafts/Draft';
import type { DraftId } from '@/domain/drafts/DraftId';

export interface ArchiveDraftInput {
  readonly id: DraftId;
}

export type ArchiveDraftOutcome =
  | { readonly kind: 'archived' }
  | { readonly kind: 'not_found' }
  | { readonly kind: 'corrupt'; readonly cause: unknown }
  | { readonly kind: 'storage_unavailable'; readonly cause: unknown };

type PhaseResult =
  | { readonly ok: true; readonly draft: Draft }
  | { readonly ok: false; readonly outcome: ArchiveDraftOutcome };

export class ArchiveDraft {
  constructor(
    private readonly repo: DraftRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: ArchiveDraftInput): Promise<ArchiveDraftOutcome> {
    const loaded = await this.loadDraft(input.id);
    if (!loaded.ok) return loaded.outcome;
    const archived = loaded.draft.archive(this.clock.now());
    return this.persistDraft(archived);
  }

  private async loadDraft(id: DraftId): Promise<PhaseResult> {
    let outcome: FindDraftOutcome;
    try {
      outcome = await this.repo.findById(id);
    } catch (cause) {
      return { ok: false, outcome: { kind: 'storage_unavailable', cause } };
    }
    switch (outcome.kind) {
      case 'found':
        return { ok: true, draft: outcome.draft };
      case 'not_found':
        return { ok: false, outcome: { kind: 'not_found' } };
      case 'corrupt':
        return { ok: false, outcome: { kind: 'corrupt', cause: outcome.cause } };
      case 'storage_unavailable':
        return { ok: false, outcome: { kind: 'storage_unavailable', cause: outcome.cause } };
    }
  }

  private async persistDraft(draft: Draft): Promise<ArchiveDraftOutcome> {
    let saved: SaveDraftOutcome;
    try {
      saved = await this.repo.save(draft);
    } catch (cause) {
      return { kind: 'storage_unavailable', cause };
    }
    if (saved.kind === 'storage_unavailable') {
      return { kind: 'storage_unavailable', cause: saved.cause };
    }
    return { kind: 'archived' };
  }
}
