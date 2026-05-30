import type { DraftRepository } from '@/application/ports/DraftRepository';
import type { IdGenerator } from '@/application/ports/IdGenerator';
import { Draft, InvalidDraft, type DraftSnapshot } from '@/domain/drafts/Draft';
import { DraftId } from '@/domain/drafts/DraftId';

export type ImportMode = 'add' | 'replace';

export type ImportDraftsOutcome =
  | { readonly kind: 'imported'; readonly count: number }
  | { readonly kind: 'storage_unavailable'; readonly cause: unknown };

export class ImportDrafts {
  constructor(
    private readonly repo: DraftRepository,
    private readonly idGen: IdGenerator,
  ) {}

  async execute(
    snapshots: readonly DraftSnapshot[],
    mode: ImportMode,
  ): Promise<ImportDraftsOutcome> {
    const drafts = snapshots.map((snapshot) => {
      const newId = DraftId.from(this.idGen.next(), (reason) => {
        throw new InvalidDraft(reason);
      });
      return Draft.fromSnapshot({ ...snapshot, id: newId });
    });

    return mode === 'replace' ? this.replaceWith(drafts) : this.addAll(drafts);
  }

  private async replaceWith(drafts: readonly Draft[]): Promise<ImportDraftsOutcome> {
    let outcome;
    try {
      outcome = await this.repo.replaceAll(drafts);
    } catch (cause) {
      return { kind: 'storage_unavailable', cause };
    }
    if (outcome.kind === 'storage_unavailable') {
      return { kind: 'storage_unavailable', cause: outcome.cause };
    }
    return { kind: 'imported', count: drafts.length };
  }

  private async addAll(drafts: readonly Draft[]): Promise<ImportDraftsOutcome> {
    for (const draft of drafts) {
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
    return { kind: 'imported', count: drafts.length };
  }
}
