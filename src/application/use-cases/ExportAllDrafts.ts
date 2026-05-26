import type { Clock } from '@/application/ports/Clock';
import type { DraftRepository, FindAllDraftsOutcome } from '@/application/ports/DraftRepository';
import type { DraftSnapshot } from '@/domain/drafts/Draft';

export interface ExportBundle {
  readonly version: 1;
  readonly exportedAt: number;
  readonly drafts: readonly DraftSnapshot[];
}

export type ExportAllDraftsOutcome =
  | { readonly kind: 'exported'; readonly bundle: ExportBundle }
  | { readonly kind: 'storage_unavailable'; readonly cause: unknown };

export class ExportAllDrafts {
  constructor(
    private readonly repo: DraftRepository,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<ExportAllDraftsOutcome> {
    let result: FindAllDraftsOutcome;
    try {
      result = await this.repo.findAll();
    } catch (cause) {
      return { kind: 'storage_unavailable', cause };
    }
    if (result.kind === 'storage_unavailable') {
      return { kind: 'storage_unavailable', cause: result.cause };
    }
    return {
      kind: 'exported',
      bundle: {
        version: 1,
        exportedAt: this.clock.now().getTime(),
        drafts: result.drafts.map((d) => d.toSnapshot()),
      },
    };
  }
}
