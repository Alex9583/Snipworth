import type { Clock } from '@/application/ports/Clock';
import type { DraftRepository, SaveDraftOutcome } from '@/application/ports/DraftRepository';
import type { IdGenerator } from '@/application/ports/IdGenerator';
import { Draft, InvalidDraft } from '@/domain/drafts/Draft';
import { DraftId } from '@/domain/drafts/DraftId';
import { deriveTitleFromCode } from '@/domain/drafts/deriveTitleFromCode';
import type { Platform } from '@/domain/drafts/Platform';
import type { RenderConfig } from '@/domain/rendering/RenderConfig';

export interface SaveCurrentEditorAsDraftInput {
  readonly code: string;
  readonly language: string;
  readonly config: RenderConfig;
  readonly caption: string;
  readonly hashtags: readonly string[];
  readonly platform: Platform;
}

export type SaveCurrentEditorAsDraftOutcome =
  | { readonly kind: 'saved'; readonly draftId: DraftId }
  | { readonly kind: 'empty_code' }
  | { readonly kind: 'storage_unavailable'; readonly cause: unknown };

const INITIAL_THUMBNAIL = null;

const failDraft = (reason: string): never => {
  throw new InvalidDraft(reason);
};

export class SaveCurrentEditorAsDraft {
  constructor(
    private readonly repo: DraftRepository,
    private readonly idGen: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: SaveCurrentEditorAsDraftInput): Promise<SaveCurrentEditorAsDraftOutcome> {
    if (input.code.trim().length === 0) {
      return { kind: 'empty_code' };
    }
    const draftId = DraftId.from(this.idGen.next(), failDraft);
    const draft = Draft.create({
      id: draftId,
      title: deriveTitleFromCode(input.code),
      code: input.code,
      language: input.language,
      config: input.config,
      caption: input.caption,
      hashtags: input.hashtags,
      platform: input.platform,
      thumbnail: INITIAL_THUMBNAIL,
      createdAt: this.clock.now(),
    });
    let saved: SaveDraftOutcome;
    try {
      saved = await this.repo.save(draft);
    } catch (cause) {
      return { kind: 'storage_unavailable', cause };
    }
    if (saved.kind === 'storage_unavailable') {
      return { kind: 'storage_unavailable', cause: saved.cause };
    }
    return { kind: 'saved', draftId };
  }
}
