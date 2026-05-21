import type { Clock } from '@/application/ports/Clock';
import type { DraftRepository } from '@/application/ports/DraftRepository';
import { Draft, InvalidDraft } from '@/domain/drafts/Draft';
import type { DraftId } from '@/domain/drafts/DraftId';
import type { Platform } from '@/domain/drafts/Platform';
import type { RenderConfig } from '@/domain/rendering/RenderConfig';
import { type DraftTransitionFailure, loadDraft, persistDraft } from './draftTransition';

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
  | DraftTransitionFailure;

type ApplyPatchResult =
  | { readonly ok: true; readonly draft: Draft }
  | { readonly ok: false; readonly outcome: UpdateDraftOutcome };

export class UpdateDraft {
  constructor(
    private readonly repo: DraftRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: UpdateDraftInput): Promise<UpdateDraftOutcome> {
    const loaded = await loadDraft(this.repo, input.id);
    if (!loaded.ok) return loaded.outcome;

    if (isEmptyPatch(input.patch)) return { kind: 'updated' };
    if (hasBlankCode(input.patch)) return { kind: 'empty_code' };

    const applied = applyPatch(loaded.draft, input.patch, this.clock.now());
    if (!applied.ok) return applied.outcome;

    return persistDraft(this.repo, applied.draft, 'updated');
  }
}

function isEmptyPatch(patch: UpdateDraftPatch): boolean {
  return Object.keys(patch).length === 0;
}

function hasBlankCode(patch: UpdateDraftPatch): boolean {
  return patch.code?.trim().length === 0;
}

function applyPatch(initial: Draft, patch: UpdateDraftPatch, now: Date): ApplyPatchResult {
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

function tryApply(field: string, apply: () => Draft): ApplyPatchResult {
  try {
    return { ok: true, draft: apply() };
  } catch (cause) {
    if (cause instanceof InvalidDraft) {
      return { ok: false, outcome: { kind: 'invalid_field', field, cause } };
    }
    throw cause;
  }
}
