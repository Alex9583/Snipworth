import { describe, it, expect } from 'vitest';
import { DeleteDraft } from '@/application/use-cases/DeleteDraft';
import { Draft } from '@/domain/drafts/Draft';
import type { DraftId } from '@/domain/drafts/DraftId';
import { RenderConfig } from '@/domain/rendering/RenderConfig';
import { InMemoryDraftRepository } from '../../../setup/fakes/InMemoryDraftRepository';

const CREATED_AT = new Date('2026-05-15T10:00:00Z');

function aSeedDraft(overrides: { id?: string } = {}): Draft {
  return Draft.create({
    id: (overrides.id ?? 'draft-1') as DraftId,
    title: 'Hello',
    code: 'hello()',
    language: 'typescript',
    config: RenderConfig.default(),
    caption: '',
    hashtags: [],
    platform: 'x',
    createdAt: CREATED_AT,
  });
}

describe('DeleteDraft', () => {
  it('should_return_deleted_when_DeleteDraft_executes_against_an_existing_id', async () => {
    const repo = new InMemoryDraftRepository();
    const seed = aSeedDraft();
    await repo.save(seed);
    const useCase = new DeleteDraft(repo);

    const outcome = await useCase.execute({ id: seed.id });

    expect(outcome).toEqual({ kind: 'deleted' });
  });

  it('should_remove_the_draft_from_the_repository_when_DeleteDraft_executes_against_an_existing_id', async () => {
    const repo = new InMemoryDraftRepository();
    const seed = aSeedDraft();
    await repo.save(seed);
    const useCase = new DeleteDraft(repo);

    await useCase.execute({ id: seed.id });

    const findResult = await repo.findById(seed.id);
    expect(findResult).toEqual({ kind: 'not_found' });
  });

  it('should_return_deleted_when_DeleteDraft_executes_against_an_id_that_does_not_exist', async () => {
    const repo = new InMemoryDraftRepository();
    const useCase = new DeleteDraft(repo);

    const outcome = await useCase.execute({ id: 'draft-999' as DraftId });

    expect(outcome).toEqual({ kind: 'deleted' });
  });

  it('should_return_storage_unavailable_carrying_the_thrown_cause_when_repo_delete_throws', async () => {
    const repo = new InMemoryDraftRepository();
    const thrown = new Error('dexie connection lost');
    repo.failNextDeleteWith(thrown);
    const useCase = new DeleteDraft(repo);

    const outcome = await useCase.execute({ id: 'draft-1' as DraftId });

    expect(outcome.kind).toBe('storage_unavailable');
    if (outcome.kind !== 'storage_unavailable') return;
    expect(outcome.cause).toBe(thrown);
  });

  it('should_return_storage_unavailable_carrying_the_repo_typed_cause_when_delete_returns_storage_unavailable', async () => {
    const repo = new InMemoryDraftRepository();
    const cause = { code: 'QuotaExceededError', name: 'QuotaExceededError' };
    repo.enqueueNextDeleteOutcome({ kind: 'storage_unavailable', cause });
    const useCase = new DeleteDraft(repo);

    const outcome = await useCase.execute({ id: 'draft-1' as DraftId });

    expect(outcome.kind).toBe('storage_unavailable');
    if (outcome.kind !== 'storage_unavailable') return;
    expect(outcome.cause).toBe(cause);
  });
});
