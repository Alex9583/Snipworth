import type {
  DraftRepository,
  FindDraftOutcome,
  SaveDraftOutcome,
} from '@/application/ports/DraftRepository';
import type { Draft } from '@/domain/drafts/Draft';
import type { DraftId } from '@/domain/drafts/DraftId';

export type DraftTransitionFailure =
  | { readonly kind: 'not_found' }
  | { readonly kind: 'corrupt'; readonly cause: unknown }
  | { readonly kind: 'storage_unavailable'; readonly cause: unknown };

export type LoadDraftResult =
  | { readonly ok: true; readonly draft: Draft }
  | { readonly ok: false; readonly outcome: DraftTransitionFailure };

export async function loadDraft(repo: DraftRepository, id: DraftId): Promise<LoadDraftResult> {
  let outcome: FindDraftOutcome;
  try {
    outcome = await repo.findById(id);
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

export type PersistDraftResult<TSuccessKind extends string> =
  | { readonly kind: TSuccessKind }
  | { readonly kind: 'storage_unavailable'; readonly cause: unknown };

export async function persistDraft<TSuccessKind extends string>(
  repo: DraftRepository,
  draft: Draft,
  successKind: TSuccessKind,
): Promise<PersistDraftResult<TSuccessKind>> {
  let saved: SaveDraftOutcome;
  try {
    saved = await repo.save(draft);
  } catch (cause) {
    return { kind: 'storage_unavailable', cause };
  }
  if (saved.kind === 'storage_unavailable') {
    return { kind: 'storage_unavailable', cause: saved.cause };
  }
  return { kind: successKind };
}
