import type {
  DeleteDraftOutcome,
  DraftRepository,
  FindAllDraftsOutcome,
  FindDraftOutcome,
  SaveDraftOutcome,
} from '@/application/ports/DraftRepository';
import { Draft, type DraftSnapshot } from '@/domain/drafts/Draft';
import type { DraftId } from '@/domain/drafts/DraftId';

type NextOutcome<T> =
  | { readonly kind: 'throw'; readonly error: Error }
  | { readonly kind: 'return'; readonly value: T };

export class InMemoryDraftRepository implements DraftRepository {
  private readonly store = new Map<string, DraftSnapshot>();
  private pendingSave: NextOutcome<SaveDraftOutcome> | undefined;

  /**
   * Queue the next `save` call's outcome. Pass an `Error` to make it throw
   * (mirroring a Dexie connection crash); pass a `SaveDraftOutcome` to make
   * it return that typed variant (mirroring an adapter that catches and
   * surfaces `storage_unavailable`). Consumed once, then the fake reverts
   * to its normal store-and-confirm behavior.
   */
  enqueueNextSave(input: Error | SaveDraftOutcome): void {
    this.pendingSave =
      input instanceof Error ? { kind: 'throw', error: input } : { kind: 'return', value: input };
  }

  save(draft: Draft): Promise<SaveDraftOutcome> {
    if (this.pendingSave !== undefined) {
      const pending = this.pendingSave;
      this.pendingSave = undefined;
      return pending.kind === 'throw'
        ? Promise.reject(pending.error)
        : Promise.resolve(pending.value);
    }
    this.store.set(draft.id, draft.toSnapshot());
    return Promise.resolve({ kind: 'saved' });
  }

  findById(_id: DraftId): Promise<FindDraftOutcome> {
    return Promise.reject(
      new Error(
        'InMemoryDraftRepository.findById not yet implemented — wire under the use case that needs it',
      ),
    );
  }

  findAll(): Promise<FindAllDraftsOutcome> {
    const drafts = Array.from(this.store.values(), (snapshot) => Draft.fromSnapshot(snapshot));
    return Promise.resolve({ kind: 'loaded', drafts, corrupt: [] });
  }

  delete(_id: DraftId): Promise<DeleteDraftOutcome> {
    return Promise.reject(
      new Error(
        'InMemoryDraftRepository.delete not yet implemented — wire under the use case that needs it',
      ),
    );
  }
}
