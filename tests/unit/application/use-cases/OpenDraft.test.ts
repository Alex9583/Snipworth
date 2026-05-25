import { describe, it, expect } from 'vitest';
import { OpenDraft } from '@/application/use-cases/OpenDraft';
import { Draft } from '@/domain/drafts/Draft';
import type { DraftId } from '@/domain/drafts/DraftId';
import { RenderConfig } from '@/domain/rendering/RenderConfig';
import { InMemoryDraftRepository } from '../../../setup/fakes/InMemoryDraftRepository';

const CREATED_AT = new Date('2026-05-15T10:00:00Z');

function aSeedDraft(overrides: { id?: string; title?: string; code?: string } = {}): Draft {
  return Draft.create({
    id: (overrides.id ?? 'draft-1') as DraftId,
    title: overrides.title ?? 'Hello',
    code: overrides.code ?? 'hello()',
    language: 'typescript',
    config: RenderConfig.default(),
    caption: '',
    hashtags: [],
    platform: 'x',
    createdAt: CREATED_AT,
  });
}

describe('OpenDraft', () => {
  it('should_return_found_with_the_stored_snapshot_when_the_id_exists_in_the_repository', async () => {
    const repo = new InMemoryDraftRepository();
    const seed = aSeedDraft();
    await repo.save(seed);
    const useCase = new OpenDraft(repo);

    const outcome = await useCase.execute({ id: seed.id });

    expect(outcome).toEqual({ kind: 'found', snapshot: seed.toSnapshot() });
  });

  it('should_return_not_found_when_no_draft_exists_with_the_given_id', async () => {
    const repo = new InMemoryDraftRepository();
    const useCase = new OpenDraft(repo);

    const outcome = await useCase.execute({ id: 'draft-999' as DraftId });

    expect(outcome).toEqual({ kind: 'not_found' });
  });

  it('should_return_corrupt_carrying_the_repo_cause_when_findById_yields_a_corrupt_outcome', async () => {
    const repo = new InMemoryDraftRepository();
    const cause = { issues: [{ path: ['code'], message: 'expected string' }] };
    repo.seedCorruptRow('draft-1' as DraftId, cause);
    const useCase = new OpenDraft(repo);

    const outcome = await useCase.execute({ id: 'draft-1' as DraftId });

    expect(outcome.kind).toBe('corrupt');
    if (outcome.kind !== 'corrupt') return;
    expect(outcome.cause).toBe(cause);
  });

  it('should_return_storage_unavailable_carrying_the_thrown_cause_when_findById_throws', async () => {
    const repo = new InMemoryDraftRepository();
    const thrown = new Error('dexie connection lost');
    repo.failNextFindByIdWith(thrown);
    const useCase = new OpenDraft(repo);

    const outcome = await useCase.execute({ id: 'draft-1' as DraftId });

    expect(outcome.kind).toBe('storage_unavailable');
    if (outcome.kind !== 'storage_unavailable') return;
    expect(outcome.cause).toBe(thrown);
  });

  it('should_return_storage_unavailable_carrying_the_repo_typed_cause_when_findById_returns_storage_unavailable', async () => {
    const repo = new InMemoryDraftRepository();
    const cause = { code: 'QuotaExceededError', name: 'QuotaExceededError' };
    repo.enqueueNextFindByIdOutcome({ kind: 'storage_unavailable', cause });
    const useCase = new OpenDraft(repo);

    const outcome = await useCase.execute({ id: 'draft-1' as DraftId });

    expect(outcome.kind).toBe('storage_unavailable');
    if (outcome.kind !== 'storage_unavailable') return;
    expect(outcome.cause).toBe(cause);
  });
});
