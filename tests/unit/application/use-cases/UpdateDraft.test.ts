import { describe, it, expect } from 'vitest';
import { UpdateDraft, type UpdateDraftPatch } from '@/application/use-cases/UpdateDraft';
import { Draft, InvalidDraft } from '@/domain/drafts/Draft';
import type { DraftId } from '@/domain/drafts/DraftId';
import type { Platform } from '@/domain/drafts/Platform';
import { CAPTION_MAX, CODE_MAX, TITLE_MAX } from '@/domain/limits';
import { RenderConfig } from '@/domain/rendering/RenderConfig';
import { FakeClock } from '../../../setup/fakes/FakeClock';
import { InMemoryDraftRepository } from '../../../setup/fakes/InMemoryDraftRepository';

const CREATED_AT = new Date('2026-05-15T10:00:00Z');
const UPDATED_AT = new Date('2026-05-15T10:30:00Z');

function aSeedDraft(
  overrides: { id?: string; title?: string; code?: string; language?: string } = {},
): Draft {
  return Draft.create({
    id: (overrides.id ?? 'draft-1') as DraftId,
    title: overrides.title ?? 'Old',
    code: overrides.code ?? 'const x = 1;',
    language: overrides.language ?? 'typescript',
    config: RenderConfig.default(),
    caption: '',
    hashtags: [],
    platform: 'x',
    createdAt: CREATED_AT,
  });
}

async function buildHarness(seed: Draft) {
  const repo = new InMemoryDraftRepository();
  await repo.save(seed);
  const clock = new FakeClock(UPDATED_AT);
  const useCase = new UpdateDraft(repo, clock);
  return { repo, clock, useCase };
}

describe('UpdateDraft', () => {
  it('should_return_updated_with_the_persisted_snapshot_when_a_title_patch_is_applied_to_an_existing_draft', async () => {
    const seed = aSeedDraft();
    const { useCase } = await buildHarness(seed);

    const outcome = await useCase.execute({ id: seed.id, patch: { title: 'New title' } });

    expect(outcome).toEqual({
      kind: 'updated',
      snapshot: {
        ...seed.toSnapshot(),
        title: 'New title',
        updatedAt: UPDATED_AT.getTime(),
      },
    });
  });

  it('should_persist_the_renamed_title_and_bump_updatedAt_to_Clock_now_leaving_other_fields_unchanged_when_a_title_patch_is_applied', async () => {
    const seed = aSeedDraft();
    const { repo, useCase } = await buildHarness(seed);

    await useCase.execute({ id: seed.id, patch: { title: 'New title' } });

    const found = await repo.findById(seed.id);
    if (found.kind !== 'found') throw new Error('expected found');
    expect(found.draft.toSnapshot()).toEqual({
      ...seed.toSnapshot(),
      title: 'New title',
      updatedAt: UPDATED_AT.getTime(),
    });
  });

  it('should_persist_the_new_code_and_language_when_both_are_provided_in_the_patch', async () => {
    const seed = aSeedDraft({ code: 'const x = 1;', language: 'typescript' });
    const { repo, useCase } = await buildHarness(seed);

    await useCase.execute({
      id: seed.id,
      patch: { code: 'print("hi")', language: 'python' },
    });

    const found = await repo.findById(seed.id);
    if (found.kind !== 'found') throw new Error('expected found');
    const snapshot = found.draft.toSnapshot();
    expect(snapshot.code).toBe('print("hi")');
    expect(snapshot.language).toBe('python');
  });

  it('should_persist_the_new_caption_when_a_caption_patch_is_applied', async () => {
    const seed = aSeedDraft();
    const { repo, useCase } = await buildHarness(seed);

    await useCase.execute({ id: seed.id, patch: { caption: 'New caption' } });

    const found = await repo.findById(seed.id);
    if (found.kind !== 'found') throw new Error('expected found');
    expect(found.draft.toSnapshot().caption).toBe('New caption');
  });

  it('should_persist_normalized_hashtags_when_a_hashtags_patch_is_applied', async () => {
    const seed = aSeedDraft();
    const { repo, useCase } = await buildHarness(seed);

    await useCase.execute({
      id: seed.id,
      patch: { hashtags: ['typescript', '#react ', '  '] },
    });

    const found = await repo.findById(seed.id);
    if (found.kind !== 'found') throw new Error('expected found');
    expect(found.draft.toSnapshot().hashtags).toEqual(['#typescript', '#react']);
  });

  it('should_persist_the_new_platform_and_re_apply_its_aspect_ratio_preset_when_a_platform_patch_is_applied', async () => {
    const seed = aSeedDraft();
    const { repo, useCase } = await buildHarness(seed);

    await useCase.execute({ id: seed.id, patch: { platform: 'instagram' } });

    const found = await repo.findById(seed.id);
    if (found.kind !== 'found') throw new Error('expected found');
    const snapshot = found.draft.toSnapshot();
    expect(snapshot.platform).toBe('instagram');
    expect(snapshot.config.aspectRatio).toEqual({ kind: 'fixed', ratio: '1:1' });
  });

  it('should_apply_the_manual_config_override_AFTER_the_platform_preset_when_BOTH_are_in_the_patch', async () => {
    const seed = aSeedDraft();
    const { repo, useCase } = await buildHarness(seed);
    const overrideConfig = RenderConfig.default().withAspectRatio({ kind: 'fixed', ratio: '4:5' });

    await useCase.execute({
      id: seed.id,
      patch: { platform: 'instagram', config: overrideConfig },
    });

    const found = await repo.findById(seed.id);
    if (found.kind !== 'found') throw new Error('expected found');
    const snapshot = found.draft.toSnapshot();
    expect(snapshot.platform).toBe('instagram');
    expect(snapshot.config.aspectRatio).toEqual({ kind: 'fixed', ratio: '4:5' });
  });

  it('should_return_updated_with_the_unchanged_snapshot_and_skip_repo_save_when_the_patch_is_empty', async () => {
    const seed = aSeedDraft();
    const { repo, useCase } = await buildHarness(seed);
    const savesBeforeExecute = repo.savedSnapshots.length;

    const outcome = await useCase.execute({ id: seed.id, patch: {} });

    expect(outcome).toEqual({ kind: 'updated', snapshot: seed.toSnapshot() });
    expect(repo.savedSnapshots.length).toBe(savesBeforeExecute);
    const found = await repo.findById(seed.id);
    if (found.kind !== 'found') throw new Error('expected found');
    expect(found.draft.toSnapshot().updatedAt).toBe(seed.toSnapshot().updatedAt);
  });

  it('should_return_empty_code_and_leave_the_stored_draft_unchanged_when_the_patch_code_is_blank', async () => {
    const seed = aSeedDraft();
    const { repo, useCase } = await buildHarness(seed);
    const savesBeforeExecute = repo.savedSnapshots.length;

    const outcome = await useCase.execute({
      id: seed.id,
      patch: { code: '   \n  ', language: 'typescript' },
    });

    expect(outcome).toEqual({ kind: 'empty_code' });
    expect(repo.savedSnapshots.length).toBe(savesBeforeExecute);
    const found = await repo.findById(seed.id);
    if (found.kind !== 'found') throw new Error('expected found');
    expect(found.draft.toSnapshot()).toEqual(seed.toSnapshot());
  });

  it.each<[string, string, UpdateDraftPatch]>([
    ['title', 'title_exceeds_TITLE_MAX', { title: 'a'.repeat(TITLE_MAX + 1) }],
    ['code', 'code_exceeds_CODE_MAX', { code: 'a'.repeat(CODE_MAX + 1) }],
    ['platform', 'an_unknown_platform_is_patched', { platform: '__bogus' as Platform }],
    ['caption', 'caption_exceeds_CAPTION_MAX', { caption: 'a'.repeat(CAPTION_MAX + 1) }],
    ['hashtags', 'a_patched_hashtag_is_malformed', { hashtags: ['#hello world'] }],
  ])(
    'should_return_invalid_field_with_field_%s_and_the_InvalidDraft_cause_when_%s',
    async (field, _trigger, patch) => {
      const seed = aSeedDraft();
      const { repo, useCase } = await buildHarness(seed);
      const savesBeforeExecute = repo.savedSnapshots.length;

      const outcome = await useCase.execute({ id: seed.id, patch });

      expect(outcome.kind).toBe('invalid_field');
      if (outcome.kind !== 'invalid_field') return;
      expect(outcome.field).toBe(field);
      expect(outcome.cause).toBeInstanceOf(InvalidDraft);
      expect(repo.savedSnapshots.length).toBe(savesBeforeExecute);
      const found = await repo.findById(seed.id);
      if (found.kind !== 'found') throw new Error('expected found');
      expect(found.draft.toSnapshot()).toEqual(seed.toSnapshot());
    },
  );

  it('should_return_not_found_when_the_id_does_not_exist_in_the_repository', async () => {
    const repo = new InMemoryDraftRepository();
    const useCase = new UpdateDraft(repo, new FakeClock(UPDATED_AT));

    const outcome = await useCase.execute({
      id: 'draft-999' as DraftId,
      patch: { title: 'X' },
    });

    expect(outcome).toEqual({ kind: 'not_found' });
    expect(repo.savedSnapshots).toHaveLength(0);
  });

  it('should_return_corrupt_carrying_the_repo_cause_when_findById_yields_a_corrupt_outcome_during_update', async () => {
    const repo = new InMemoryDraftRepository();
    const cause = { issues: [{ path: ['code'], message: 'expected string' }] };
    repo.seedCorruptRow('draft-1' as DraftId, cause);
    const useCase = new UpdateDraft(repo, new FakeClock(UPDATED_AT));

    const outcome = await useCase.execute({
      id: 'draft-1' as DraftId,
      patch: { title: 'X' },
    });

    expect(outcome.kind).toBe('corrupt');
    if (outcome.kind !== 'corrupt') return;
    expect(outcome.cause).toBe(cause);
    expect(repo.savedSnapshots).toHaveLength(0);
  });

  it('should_return_storage_unavailable_carrying_the_thrown_cause_when_repo_save_throws_during_update', async () => {
    const seed = aSeedDraft();
    const { repo, useCase } = await buildHarness(seed);
    const thrown = new Error('dexie connection lost');
    repo.failNextSaveWith(thrown);

    const outcome = await useCase.execute({ id: seed.id, patch: { title: 'New' } });

    expect(outcome.kind).toBe('storage_unavailable');
    if (outcome.kind !== 'storage_unavailable') return;
    expect(outcome.cause).toBe(thrown);
  });

  it('should_return_storage_unavailable_carrying_the_thrown_cause_when_findById_throws_during_update', async () => {
    const repo = new InMemoryDraftRepository();
    const thrown = new Error('dexie connection lost');
    repo.failNextFindByIdWith(thrown);
    const useCase = new UpdateDraft(repo, new FakeClock(UPDATED_AT));

    const outcome = await useCase.execute({
      id: 'draft-1' as DraftId,
      patch: { title: 'X' },
    });

    expect(outcome.kind).toBe('storage_unavailable');
    if (outcome.kind !== 'storage_unavailable') return;
    expect(outcome.cause).toBe(thrown);
    expect(repo.savedSnapshots).toHaveLength(0);
  });

  it('should_return_storage_unavailable_carrying_the_repo_typed_cause_when_findById_returns_storage_unavailable_during_update', async () => {
    const repo = new InMemoryDraftRepository();
    const cause = { code: 'QuotaExceededError', name: 'QuotaExceededError' };
    repo.enqueueNextFindByIdOutcome({ kind: 'storage_unavailable', cause });
    const useCase = new UpdateDraft(repo, new FakeClock(UPDATED_AT));

    const outcome = await useCase.execute({
      id: 'draft-1' as DraftId,
      patch: { title: 'X' },
    });

    expect(outcome.kind).toBe('storage_unavailable');
    if (outcome.kind !== 'storage_unavailable') return;
    expect(outcome.cause).toBe(cause);
    expect(repo.savedSnapshots).toHaveLength(0);
  });

  it('should_return_storage_unavailable_carrying_the_repo_typed_cause_when_save_returns_storage_unavailable_during_update', async () => {
    const seed = aSeedDraft();
    const { repo, useCase } = await buildHarness(seed);
    const cause = { code: 'QuotaExceededError', name: 'QuotaExceededError' };
    repo.enqueueNextSaveOutcome({ kind: 'storage_unavailable', cause });

    const outcome = await useCase.execute({ id: seed.id, patch: { title: 'New' } });

    expect(outcome.kind).toBe('storage_unavailable');
    if (outcome.kind !== 'storage_unavailable') return;
    expect(outcome.cause).toBe(cause);
  });

  it('should_apply_all_patch_fields_in_the_fixed_title_code_platform_config_caption_hashtags_order_when_the_patch_carries_every_field', async () => {
    const seed = aSeedDraft();
    const { repo, useCase } = await buildHarness(seed);
    const overrideConfig = RenderConfig.default().withAspectRatio({ kind: 'fixed', ratio: '16:9' });

    await useCase.execute({
      id: seed.id,
      patch: {
        title: 'Renamed',
        code: 'print("hi")',
        language: 'python',
        platform: 'instagram',
        config: overrideConfig,
        caption: 'A caption',
        hashtags: ['typescript'],
      },
    });

    const found = await repo.findById(seed.id);
    if (found.kind !== 'found') throw new Error('expected found');
    const snapshot = found.draft.toSnapshot();
    expect(snapshot.title).toBe('Renamed');
    expect(snapshot.code).toBe('print("hi")');
    expect(snapshot.language).toBe('python');
    expect(snapshot.platform).toBe('instagram');
    expect(snapshot.config.aspectRatio).toEqual({ kind: 'fixed', ratio: '16:9' });
    expect(snapshot.caption).toBe('A caption');
    expect(snapshot.hashtags).toEqual(['#typescript']);
  });
});
