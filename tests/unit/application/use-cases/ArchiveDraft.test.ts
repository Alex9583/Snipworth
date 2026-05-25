import { describe, expect, it } from 'vitest';
import { ArchiveDraft } from '@/application/use-cases/ArchiveDraft';
import type { Draft } from '@/domain/drafts/Draft';
import type { DraftId } from '@/domain/drafts/DraftId';
import { FakeClock } from '../../../setup/fakes/FakeClock';
import { InMemoryDraftRepository } from '../../../setup/fakes/InMemoryDraftRepository';
import { anActiveDraft, anArchivedDraft } from '../../../setup/mothers/DraftMother';

const UPDATED_AT = new Date('2026-05-15T10:30:00Z');

async function buildHarness(seed: Draft) {
  const repo = new InMemoryDraftRepository();
  await repo.save(seed);
  const clock = new FakeClock(UPDATED_AT);
  const useCase = new ArchiveDraft(repo, clock);
  return { repo, clock, useCase };
}

describe('ArchiveDraft', () => {
  it('should_return_archived_and_persist_status_archived_with_updatedAt_bumped_to_Clock_now_when_input_is_an_active_draft', async () => {
    const seed = anActiveDraft();
    const { repo, useCase } = await buildHarness(seed);

    const outcome = await useCase.execute({ id: seed.id });

    expect(outcome).toEqual({ kind: 'archived' });
    const found = await repo.findById(seed.id);
    if (found.kind !== 'found') throw new Error('expected found');
    expect(found.draft.toSnapshot()).toEqual({
      ...seed.toSnapshot(),
      status: 'archived',
      updatedAt: UPDATED_AT.getTime(),
    });
  });

  it('should_return_archived_and_bump_updatedAt_to_Clock_now_when_input_is_an_already_archived_draft', async () => {
    const earlierArchive = new Date('2026-05-15T09:00:00Z');
    const seed = anArchivedDraft(earlierArchive);
    const { repo, useCase } = await buildHarness(seed);

    const outcome = await useCase.execute({ id: seed.id });

    expect(outcome).toEqual({ kind: 'archived' });
    const found = await repo.findById(seed.id);
    if (found.kind !== 'found') throw new Error('expected found');
    expect(found.draft.toSnapshot()).toEqual({
      ...seed.toSnapshot(),
      status: 'archived',
      updatedAt: UPDATED_AT.getTime(),
    });
  });

  it('should_return_not_found_and_skip_save_when_id_does_not_exist', async () => {
    const repo = new InMemoryDraftRepository();
    const useCase = new ArchiveDraft(repo, new FakeClock(UPDATED_AT));

    const outcome = await useCase.execute({ id: 'draft-999' as DraftId });

    expect(outcome).toEqual({ kind: 'not_found' });
    expect(repo.savedSnapshots).toHaveLength(0);
  });

  it('should_return_corrupt_carrying_the_repo_cause_and_skip_save_when_findById_yields_a_corrupt_outcome', async () => {
    const repo = new InMemoryDraftRepository();
    const cause = { issues: [{ path: ['code'], message: 'expected string' }] };
    repo.seedCorruptRow('draft-1' as DraftId, cause);
    const useCase = new ArchiveDraft(repo, new FakeClock(UPDATED_AT));

    const outcome = await useCase.execute({ id: 'draft-1' as DraftId });

    expect(outcome.kind).toBe('corrupt');
    if (outcome.kind !== 'corrupt') return;
    expect(outcome.cause).toBe(cause);
    expect(repo.savedSnapshots).toHaveLength(0);
  });

  it('should_return_storage_unavailable_carrying_the_thrown_cause_when_repo_save_throws', async () => {
    const seed = anActiveDraft();
    const { repo, useCase } = await buildHarness(seed);
    const thrown = new Error('dexie connection lost');
    repo.failNextSaveWith(thrown);

    const outcome = await useCase.execute({ id: seed.id });

    expect(outcome.kind).toBe('storage_unavailable');
    if (outcome.kind !== 'storage_unavailable') return;
    expect(outcome.cause).toBe(thrown);
  });

  it('should_return_storage_unavailable_carrying_the_repo_typed_cause_when_save_returns_storage_unavailable', async () => {
    const seed = anActiveDraft();
    const { repo, useCase } = await buildHarness(seed);
    const cause = { code: 'QuotaExceededError', name: 'QuotaExceededError' };
    repo.enqueueNextSaveOutcome({ kind: 'storage_unavailable', cause });

    const outcome = await useCase.execute({ id: seed.id });

    expect(outcome.kind).toBe('storage_unavailable');
    if (outcome.kind !== 'storage_unavailable') return;
    expect(outcome.cause).toBe(cause);
  });

  it('should_return_storage_unavailable_carrying_the_thrown_cause_and_skip_save_when_findById_throws', async () => {
    const repo = new InMemoryDraftRepository();
    const thrown = new Error('dexie connection lost');
    repo.failNextFindByIdWith(thrown);
    const useCase = new ArchiveDraft(repo, new FakeClock(UPDATED_AT));

    const outcome = await useCase.execute({ id: 'draft-1' as DraftId });

    expect(outcome.kind).toBe('storage_unavailable');
    if (outcome.kind !== 'storage_unavailable') return;
    expect(outcome.cause).toBe(thrown);
    expect(repo.savedSnapshots).toHaveLength(0);
  });

  it('should_return_storage_unavailable_carrying_the_repo_typed_cause_and_skip_save_when_findById_returns_storage_unavailable', async () => {
    const repo = new InMemoryDraftRepository();
    const cause = { code: 'QuotaExceededError', name: 'QuotaExceededError' };
    repo.enqueueNextFindByIdOutcome({ kind: 'storage_unavailable', cause });
    const useCase = new ArchiveDraft(repo, new FakeClock(UPDATED_AT));

    const outcome = await useCase.execute({ id: 'draft-1' as DraftId });

    expect(outcome.kind).toBe('storage_unavailable');
    if (outcome.kind !== 'storage_unavailable') return;
    expect(outcome.cause).toBe(cause);
    expect(repo.savedSnapshots).toHaveLength(0);
  });
});
