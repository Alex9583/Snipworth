import type { UpdateDraftInput, UpdateDraftOutcome } from '@/application/use-cases/UpdateDraft';

interface Deferred {
  readonly resolve: (outcome: UpdateDraftOutcome) => void;
}

export class SpyUpdateDraft {
  readonly calls: UpdateDraftInput[] = [];
  private readonly deferredQueue: Deferred[] = [];
  private nextIsDeferred = false;

  enqueueDeferredOutcome(): void {
    this.nextIsDeferred = true;
  }

  resolveNextDeferred(outcome: UpdateDraftOutcome): void {
    const next = this.deferredQueue.shift();
    if (next === undefined) {
      throw new Error('SpyUpdateDraft.resolveNextDeferred: no pending deferred outcome');
    }
    next.resolve(outcome);
  }

  execute(input: UpdateDraftInput): Promise<UpdateDraftOutcome> {
    this.calls.push(input);
    if (this.nextIsDeferred) {
      this.nextIsDeferred = false;
      return new Promise<UpdateDraftOutcome>((resolve) => {
        this.deferredQueue.push({ resolve });
      });
    }
    return Promise.resolve({ kind: 'updated' });
  }
}
