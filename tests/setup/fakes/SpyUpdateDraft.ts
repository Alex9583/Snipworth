import type { UpdateDraftInput, UpdateDraftOutcome } from '@/application/use-cases/UpdateDraft';
import type { DraftSnapshot } from '@/domain/drafts/Draft';
import { RenderConfig } from '@/domain/rendering/RenderConfig';

interface Deferred {
  readonly resolve: (outcome: UpdateDraftOutcome) => void;
}

const DEFAULT_UPDATED_SNAPSHOT: DraftSnapshot = {
  id: 'spy-update-default',
  title: 'spy-update default',
  code: '// spy',
  language: 'plaintext',
  config: RenderConfig.default().toSnapshot(),
  caption: '',
  hashtags: [],
  platform: 'x',
  status: 'draft',
  createdAt: 0,
  updatedAt: 0,
};

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
    return Promise.resolve({ kind: 'updated', snapshot: DEFAULT_UPDATED_SNAPSHOT });
  }
}
