import { describe, it, expect } from 'vitest';
import { ImportDrafts } from '@/application/use-cases/ImportDrafts';
import { anActiveDraft } from '../../../setup/mothers/DraftMother';
import { FixedIdGenerator } from '../../../setup/fakes/FixedIdGenerator';
import { InMemoryDraftRepository } from '../../../setup/fakes/InMemoryDraftRepository';

function buildHarness() {
  const repo = new InMemoryDraftRepository();
  const idGen = new FixedIdGenerator('imported');
  const useCase = new ImportDrafts(repo, idGen);
  return { repo, idGen, useCase };
}

describe('ImportDrafts', () => {
  it('should_import_nothing_when_given_empty_array', async () => {
    const { repo, idGen, useCase } = buildHarness();

    const outcome = await useCase.execute([]);

    expect(outcome).toEqual({ kind: 'imported', count: 0 });
    const findAll = await repo.findAll();
    if (findAll.kind !== 'loaded') throw new Error('expected loaded');
    expect(findAll.drafts).toHaveLength(0);
    expect(idGen.consumedCount).toBe(0);
  });

  it('should_save_draft_with_new_id_preserving_original_data', async () => {
    const { repo, useCase } = buildHarness();
    const original = anActiveDraft({ id: 'original-id' });
    const snapshot = original.toSnapshot();

    const outcome = await useCase.execute([snapshot]);

    expect(outcome).toEqual({ kind: 'imported', count: 1 });
    const findAll = await repo.findAll();
    if (findAll.kind !== 'loaded') throw new Error('expected loaded');
    expect(findAll.drafts).toHaveLength(1);
    const first = findAll.drafts[0];
    if (first === undefined) throw new Error('expected one draft');
    const imported = first.toSnapshot();
    expect(imported.id).toBe('imported-1');
    expect(imported.title).toBe(snapshot.title);
    expect(imported.code).toBe(snapshot.code);
    expect(imported.language).toBe(snapshot.language);
    expect(imported.config).toEqual(snapshot.config);
    expect(imported.caption).toBe(snapshot.caption);
    expect(imported.hashtags).toEqual(snapshot.hashtags);
    expect(imported.platform).toBe(snapshot.platform);
    expect(imported.status).toBe(snapshot.status);
    expect(imported.createdAt).toBe(snapshot.createdAt);
    expect(imported.updatedAt).toBe(snapshot.updatedAt);
  });

  it('should_assign_unique_id_to_each_imported_draft', async () => {
    const { repo, useCase } = buildHarness();
    const snap1 = anActiveDraft({ id: 'old-1' }).toSnapshot();
    const snap2 = anActiveDraft({ id: 'old-2' }).toSnapshot();

    const outcome = await useCase.execute([snap1, snap2]);

    expect(outcome).toEqual({ kind: 'imported', count: 2 });
    const findAll = await repo.findAll();
    if (findAll.kind !== 'loaded') throw new Error('expected loaded');
    const ids = findAll.drafts.map((d) => d.id);
    expect(ids).toEqual(['imported-1', 'imported-2']);
  });

  it('should_return_storage_unavailable_when_save_fails', async () => {
    const { repo, useCase } = buildHarness();
    const snapshot = anActiveDraft().toSnapshot();
    const cause = new Error('quota exceeded');
    repo.failNextSaveWith(cause);

    const outcome = await useCase.execute([snapshot]);

    expect(outcome).toEqual({ kind: 'storage_unavailable', cause });
  });
});
