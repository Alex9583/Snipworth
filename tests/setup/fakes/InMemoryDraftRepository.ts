import type {
  DeleteDraftOutcome,
  DraftRepository,
  FindAllDraftsOutcome,
  FindDraftOutcome,
  SaveDraftOutcome,
} from '@/application/ports/DraftRepository';
import { Draft, type DraftSnapshot } from '@/domain/drafts/Draft';
import type { DraftId } from '@/domain/drafts/DraftId';

export class InMemoryDraftRepository implements DraftRepository {
  private readonly store = new Map<string, DraftSnapshot>();
  private readonly corruptRows = new Map<string, unknown>();
  private readonly savedHistory: DraftSnapshot[] = [];
  private pendingSaveThrow: Error | undefined;
  private pendingSaveOutcome: SaveDraftOutcome | undefined;
  private pendingFindByIdThrow: Error | undefined;
  private pendingFindByIdOutcome: FindDraftOutcome | undefined;
  private pendingFindAllThrow: Error | undefined;
  private pendingFindAllOutcome: FindAllDraftsOutcome | undefined;
  private pendingDeleteThrow: Error | undefined;
  private pendingDeleteOutcome: DeleteDraftOutcome | undefined;

  get savedSnapshots(): readonly DraftSnapshot[] {
    return this.savedHistory;
  }

  seedCorruptRow(id: DraftId, cause: unknown): void {
    this.corruptRows.set(id, cause);
  }

  failNextFindByIdWith(error: Error): void {
    this.pendingFindByIdThrow = error;
  }

  enqueueNextFindByIdOutcome(outcome: FindDraftOutcome): void {
    this.pendingFindByIdOutcome = outcome;
  }

  failNextFindAllWith(error: Error): void {
    this.pendingFindAllThrow = error;
  }

  enqueueNextFindAllOutcome(outcome: FindAllDraftsOutcome): void {
    this.pendingFindAllOutcome = outcome;
  }

  failNextSaveWith(error: Error): void {
    this.pendingSaveThrow = error;
  }

  failNextDeleteWith(error: Error): void {
    this.pendingDeleteThrow = error;
  }

  enqueueNextDeleteOutcome(outcome: DeleteDraftOutcome): void {
    this.pendingDeleteOutcome = outcome;
  }

  enqueueNextSaveOutcome(outcome: SaveDraftOutcome): void {
    this.pendingSaveOutcome = outcome;
  }

  save(draft: Draft): Promise<SaveDraftOutcome> {
    if (this.pendingSaveThrow !== undefined) {
      const error = this.pendingSaveThrow;
      this.pendingSaveThrow = undefined;
      return Promise.reject(error);
    }
    if (this.pendingSaveOutcome !== undefined) {
      const outcome = this.pendingSaveOutcome;
      this.pendingSaveOutcome = undefined;
      return Promise.resolve(outcome);
    }
    const snapshot = draft.toSnapshot();
    this.store.set(draft.id, snapshot);
    this.savedHistory.push(snapshot);
    return Promise.resolve({ kind: 'saved' });
  }

  findById(id: DraftId): Promise<FindDraftOutcome> {
    if (this.pendingFindByIdThrow !== undefined) {
      const error = this.pendingFindByIdThrow;
      this.pendingFindByIdThrow = undefined;
      return Promise.reject(error);
    }
    if (this.pendingFindByIdOutcome !== undefined) {
      const outcome = this.pendingFindByIdOutcome;
      this.pendingFindByIdOutcome = undefined;
      return Promise.resolve(outcome);
    }
    if (this.corruptRows.has(id)) {
      return Promise.resolve({ kind: 'corrupt', cause: this.corruptRows.get(id) });
    }
    const snapshot = this.store.get(id);
    if (snapshot === undefined) return Promise.resolve({ kind: 'not_found' });
    return Promise.resolve({ kind: 'found', draft: Draft.fromSnapshot(snapshot) });
  }

  findAll(): Promise<FindAllDraftsOutcome> {
    if (this.pendingFindAllThrow !== undefined) {
      const error = this.pendingFindAllThrow;
      this.pendingFindAllThrow = undefined;
      return Promise.reject(error);
    }
    if (this.pendingFindAllOutcome !== undefined) {
      const outcome = this.pendingFindAllOutcome;
      this.pendingFindAllOutcome = undefined;
      return Promise.resolve(outcome);
    }
    const drafts = Array.from(this.store.values(), (snapshot) => Draft.fromSnapshot(snapshot));
    const corrupt = Array.from(this.corruptRows.entries(), ([id, cause]) => ({ id, cause }));
    return Promise.resolve({ kind: 'loaded', drafts, corrupt });
  }

  delete(id: DraftId): Promise<DeleteDraftOutcome> {
    if (this.pendingDeleteThrow !== undefined) {
      const error = this.pendingDeleteThrow;
      this.pendingDeleteThrow = undefined;
      return Promise.reject(error);
    }
    if (this.pendingDeleteOutcome !== undefined) {
      const outcome = this.pendingDeleteOutcome;
      this.pendingDeleteOutcome = undefined;
      return Promise.resolve(outcome);
    }
    this.store.delete(id);
    return Promise.resolve({ kind: 'deleted' });
  }
}
