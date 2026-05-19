import type { Clock } from '@/application/ports/Clock';
import type { DraftRepository, FindDraftOutcome } from '@/application/ports/DraftRepository';
import { Draft, InvalidDraft } from '@/domain/drafts/Draft';
import type { DraftId } from '@/domain/drafts/DraftId';
import type { Platform } from '@/domain/drafts/Platform';
import type { RenderConfig } from '@/domain/rendering/RenderConfig';

export interface UpdateDraftPatch {
  readonly title?: string;
  readonly code?: string;
  readonly language?: string;
  readonly platform?: Platform;
  readonly config?: RenderConfig;
  readonly caption?: string;
  readonly hashtags?: readonly string[];
}

export interface UpdateDraftInput {
  readonly id: DraftId;
  readonly patch: UpdateDraftPatch;
}

export type UpdateDraftOutcome =
  | { readonly kind: 'updated' }
  | { readonly kind: 'empty_code' }
  | { readonly kind: 'invalid_field'; readonly field: string; readonly cause: unknown }
  | { readonly kind: 'not_found' }
  | { readonly kind: 'corrupt'; readonly cause: unknown }
  | { readonly kind: 'storage_unavailable'; readonly cause: unknown };

type PhaseResult =
  | { readonly ok: true; readonly draft: Draft }
  | { readonly ok: false; readonly outcome: UpdateDraftOutcome };

export class UpdateDraft {
  constructor(
    private readonly repo: DraftRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: UpdateDraftInput): Promise<UpdateDraftOutcome> {
    const loaded = await this.loadDraft(input.id);
    if (!loaded.ok) return loaded.outcome;

    if (isEmptyPatch(input.patch)) return { kind: 'updated' };
    if (hasBlankCode(input.patch)) return { kind: 'empty_code' };

    const applied = applyPatch(loaded.draft, input.patch, this.clock.now());
    if (!applied.ok) return applied.outcome;

    return this.persistDraft(applied.draft);
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

  private async persistDraft(draft: Draft): Promise<UpdateDraftOutcome> {
    let saved;
    try {
      saved = await this.repo.save(draft);
    } catch (cause) {
      return { kind: 'storage_unavailable', cause };
    }
    if (saved.kind === 'storage_unavailable') {
      return { kind: 'storage_unavailable', cause: saved.cause };
    }
    return { kind: 'updated' };
  }
}

function isEmptyPatch(patch: UpdateDraftPatch): boolean {
  return Object.keys(patch).length === 0;
}

function hasBlankCode(patch: UpdateDraftPatch): boolean {
  return patch.code?.trim().length === 0;
}

function applyPatch(initial: Draft, patch: UpdateDraftPatch, now: Date): PhaseResult {
  let draft = initial;
  if (patch.title !== undefined) {
    const title = patch.title;
    const result = tryApply('title', () => draft.rename(title, now));
    if (!result.ok) return result;
    draft = result.draft;
  }
  if (patch.code !== undefined) {
    const code = patch.code;
    const language = patch.language;
    const result = tryApply('code', () => draft.updateCode(code, language ?? draft.language, now));
    if (!result.ok) return result;
    draft = result.draft;
  }
  if (patch.platform !== undefined) {
    const platform = patch.platform;
    const result = tryApply('platform', () => draft.switchPlatform(platform, now));
    if (!result.ok) return result;
    draft = result.draft;
  }
  if (patch.config !== undefined) {
    draft = draft.replaceConfig(patch.config, now);
  }
  if (patch.caption !== undefined) {
    const caption = patch.caption;
    const result = tryApply('caption', () => draft.updateCaption(caption, now));
    if (!result.ok) return result;
    draft = result.draft;
  }
  if (patch.hashtags !== undefined) {
    const hashtags = patch.hashtags;
    const result = tryApply('hashtags', () => draft.updateHashtags(hashtags, now));
    if (!result.ok) return result;
    draft = result.draft;
  }
  return { ok: true, draft };
}

function tryApply(field: string, apply: () => Draft): PhaseResult {
  try {
    return { ok: true, draft: apply() };
  } catch (cause) {
    if (cause instanceof InvalidDraft) {
      return { ok: false, outcome: { kind: 'invalid_field', field, cause } };
    }
    throw cause;
  }
}
