import type { DraftRepository } from '@/application/ports/DraftRepository';
import type { IdGenerator } from '@/application/ports/IdGenerator';
import { Draft, InvalidDraft, type DraftSnapshot } from '@/domain/drafts/Draft';
import { DraftId } from '@/domain/drafts/DraftId';

export type ImportDraftsOutcome =
  | { readonly kind: 'imported'; readonly count: number }
  | { readonly kind: 'storage_unavailable'; readonly cause: unknown };

export class ImportDrafts {
  constructor(
    private readonly repo: DraftRepository,
    private readonly idGen: IdGenerator,
  ) {}

  async execute(snapshots: readonly DraftSnapshot[]): Promise<ImportDraftsOutcome> {
    for (const snapshot of snapshots) {
      const newId = DraftId.from(this.idGen.next(), (reason) => {
        throw new InvalidDraft(reason);
      });
      const draft = Draft.fromSnapshot({ ...snapshot, id: newId });
      let saved;
      try {
        saved = await this.repo.save(draft);
      } catch (cause) {
        return { kind: 'storage_unavailable', cause };
      }
      if (saved.kind === 'storage_unavailable') {
        return { kind: 'storage_unavailable', cause: saved.cause };
      }
    }
    return { kind: 'imported', count: snapshots.length };
  }
}
