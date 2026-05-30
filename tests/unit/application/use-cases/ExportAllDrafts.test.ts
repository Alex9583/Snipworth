import { describe, it, expect } from 'vitest';
import { ExportAllDrafts } from '@/application/use-cases/ExportAllDrafts';
import { anActiveDraft } from '../../../setup/mothers/DraftMother';
import { FakeClock } from '../../../setup/fakes/FakeClock';
import { InMemoryDraftRepository } from '../../../setup/fakes/InMemoryDraftRepository';

const EXPORTED_AT = new Date('2026-05-26T14:00:00Z');

function buildHarness(at: Date = EXPORTED_AT) {
  const repo = new InMemoryDraftRepository();
  const clock = new FakeClock(at);
  const useCase = new ExportAllDrafts(repo, clock);
  return { repo, clock, useCase };
}

describe('ExportAllDrafts', () => {
  it('should_export_empty_bundle_when_no_drafts_exist', async () => {
    const { useCase } = buildHarness();

    const outcome = await useCase.execute();

    expect(outcome).toEqual({
      kind: 'exported',
      bundle: {
        version: 1,
        exportedAt: EXPORTED_AT.getTime(),
        drafts: [],
      },
    });
  });

  it('should_include_draft_snapshot_in_bundle_when_draft_exists', async () => {
    const { repo, useCase } = buildHarness();
    const draft = anActiveDraft();
    await repo.save(draft);

    const outcome = await useCase.execute();

    expect(outcome.kind).toBe('exported');
    if (outcome.kind !== 'exported') return;
    expect(outcome.bundle.drafts).toEqual([draft.toSnapshot()]);
  });

  it('should_return_storage_unavailable_when_repository_fails', async () => {
    const { repo, useCase } = buildHarness();
    const cause = new Error('IndexedDB corrupted');
    repo.failNextFindAllWith(cause);

    const outcome = await useCase.execute();

    expect(outcome).toEqual({ kind: 'storage_unavailable', cause });
  });
});
