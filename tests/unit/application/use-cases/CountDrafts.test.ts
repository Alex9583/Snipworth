import { describe, it, expect } from 'vitest';

import { CountDrafts } from '@/application/use-cases/CountDrafts';

import { anActiveDraft, anArchivedDraft } from '../../../setup/mothers/DraftMother';
import { InMemoryDraftRepository } from '../../../setup/fakes/InMemoryDraftRepository';

describe('CountDrafts', () => {
  it('should_return_zero_when_no_drafts_exist', async () => {
    const repo = new InMemoryDraftRepository();
    const useCase = new CountDrafts(repo);

    const outcome = await useCase.execute();

    expect(outcome).toEqual({ kind: 'counted', total: 0 });
  });

  it('should_count_every_draft_regardless_of_status', async () => {
    const repo = new InMemoryDraftRepository();
    await repo.save(anActiveDraft({ id: 'active' }));
    await repo.save(anArchivedDraft(new Date('2026-05-16T10:00:00Z')));
    const useCase = new CountDrafts(repo);

    const outcome = await useCase.execute();

    expect(outcome).toEqual({ kind: 'counted', total: 2 });
  });

  it('should_return_storage_unavailable_when_counting_fails', async () => {
    const repo = new InMemoryDraftRepository();
    const cause = new Error('quota exceeded');
    repo.failNextCountAllWith(cause);
    const useCase = new CountDrafts(repo);

    const outcome = await useCase.execute();

    expect(outcome).toEqual({ kind: 'storage_unavailable', cause });
  });
});
