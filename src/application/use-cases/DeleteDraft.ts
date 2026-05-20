import type {
  DeleteDraftOutcome as RepoDeleteOutcome,
  DraftRepository,
} from '@/application/ports/DraftRepository';
import type { DraftId } from '@/domain/drafts/DraftId';

export interface DeleteDraftInput {
  readonly id: DraftId;
}

export type DeleteDraftOutcome =
  | { readonly kind: 'deleted' }
  | { readonly kind: 'storage_unavailable'; readonly cause: unknown };

export class DeleteDraft {
  constructor(private readonly repo: DraftRepository) {}

  async execute(input: DeleteDraftInput): Promise<DeleteDraftOutcome> {
    let outcome: RepoDeleteOutcome;
    try {
      outcome = await this.repo.delete(input.id);
    } catch (cause) {
      return { kind: 'storage_unavailable', cause };
    }
    switch (outcome.kind) {
      case 'deleted':
        return { kind: 'deleted' };
      case 'storage_unavailable':
        return { kind: 'storage_unavailable', cause: outcome.cause };
    }
  }
}
