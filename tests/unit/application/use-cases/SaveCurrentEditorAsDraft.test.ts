import { describe, it, expect } from 'vitest';
import {
  SaveCurrentEditorAsDraft,
  type SaveCurrentEditorAsDraftInput,
} from '@/application/use-cases/SaveCurrentEditorAsDraft';
import { TITLE_MAX } from '@/domain/limits';
import { RenderConfig } from '@/domain/rendering/RenderConfig';
import { FakeClock } from '../../../setup/fakes/FakeClock';
import { FixedIdGenerator } from '../../../setup/fakes/FixedIdGenerator';
import { InMemoryDraftRepository } from '../../../setup/fakes/InMemoryDraftRepository';

const SAVED_AT = new Date('2026-05-15T10:00:00Z');

function buildHarness(at: Date = SAVED_AT) {
  const repo = new InMemoryDraftRepository();
  const idGen = new FixedIdGenerator('draft');
  const clock = new FakeClock(at);
  const useCase = new SaveCurrentEditorAsDraft(repo, idGen, clock);
  return { repo, idGen, clock, useCase };
}

function validInputWith(
  overrides: Partial<SaveCurrentEditorAsDraftInput> = {},
): SaveCurrentEditorAsDraftInput {
  return {
    code: 'const x = 1;',
    language: 'typescript',
    config: RenderConfig.default(),
    caption: '',
    hashtags: [],
    platform: 'x',
    ...overrides,
  };
}

async function singlePersistedSnapshot(repo: InMemoryDraftRepository) {
  const findAll = await repo.findAll();
  if (findAll.kind !== 'loaded') throw new Error('expected loaded');
  const [first] = findAll.drafts;
  if (first === undefined) throw new Error('expected one draft');
  return first.toSnapshot();
}

describe('SaveCurrentEditorAsDraft', () => {
  it('should_return_saved_with_the_generated_draftId_when_a_valid_editor_state_is_saved', async () => {
    const { useCase } = buildHarness();

    const outcome = await useCase.execute(validInputWith({ code: 'const greeting = "hello";' }));

    expect(outcome).toEqual({ kind: 'saved', draftId: 'draft-1' });
  });

  it('should_persist_the_draft_with_id_code_language_platform_status_draft_and_the_clock_now_as_createdAt_and_updatedAt_when_a_valid_editor_state_is_saved', async () => {
    const { repo, useCase } = buildHarness();
    const config = RenderConfig.default();

    await useCase.execute(validInputWith({ code: 'const greeting = "hello";', config }));

    const persisted = await singlePersistedSnapshot(repo);
    expect(persisted).toEqual({
      id: 'draft-1',
      title: 'const greeting = "hello";',
      code: 'const greeting = "hello";',
      language: 'typescript',
      config: config.toSnapshot(),
      caption: '',
      hashtags: [],
      platform: 'x',
      thumbnail: null,
      tags: [],
      status: 'draft',
      createdAt: SAVED_AT.getTime(),
      updatedAt: SAVED_AT.getTime(),
    });
  });

  it('should_derive_the_title_from_the_first_non_blank_line_when_multiline_code_is_saved', async () => {
    const { repo, useCase } = buildHarness();

    await useCase.execute(validInputWith({ code: '\n\nfunction greet() {\n  return "hi";\n}' }));

    expect((await singlePersistedSnapshot(repo)).title).toBe('function greet() {');
  });

  it('should_persist_a_title_truncated_to_TITLE_MAX_chars_ending_with_ellipsis_when_the_first_line_exceeds_TITLE_MAX', async () => {
    const { repo, useCase } = buildHarness();

    await useCase.execute(validInputWith({ code: 'a'.repeat(250) }));

    const { title } = await singlePersistedSnapshot(repo);
    expect(title).toHaveLength(TITLE_MAX);
    expect(title.endsWith('…')).toBe(true);
  });

  it('should_return_empty_code_and_leave_the_repository_untouched_and_not_consume_an_id_when_code_is_empty', async () => {
    const { repo, idGen, useCase } = buildHarness();

    const outcome = await useCase.execute(validInputWith({ code: '' }));

    expect(outcome).toEqual({ kind: 'empty_code' });
    const findAll = await repo.findAll();
    if (findAll.kind !== 'loaded') throw new Error('expected loaded');
    expect(findAll.drafts).toHaveLength(0);
    expect(idGen.consumedCount).toBe(0);
  });

  it('should_return_empty_code_and_leave_the_repository_untouched_when_code_is_whitespace_only', async () => {
    const { repo, useCase } = buildHarness();

    const outcome = await useCase.execute(validInputWith({ code: '   \n\t  \n   ' }));

    expect(outcome).toEqual({ kind: 'empty_code' });
    const findAll = await repo.findAll();
    if (findAll.kind !== 'loaded') throw new Error('expected loaded');
    expect(findAll.drafts).toHaveLength(0);
  });

  it('should_return_storage_unavailable_carrying_the_repo_thrown_cause_when_save_throws', async () => {
    const { repo, useCase } = buildHarness();
    const thrown = new Error('dexie connection lost');
    repo.enqueueNextSave(thrown);

    const outcome = await useCase.execute(validInputWith());

    expect(outcome.kind).toBe('storage_unavailable');
    if (outcome.kind !== 'storage_unavailable') return;
    expect(outcome.cause).toBe(thrown);
  });

  it('should_return_storage_unavailable_carrying_the_repo_typed_cause_when_save_returns_storage_unavailable', async () => {
    const { repo, useCase } = buildHarness();
    const cause = { code: 'QuotaExceededError', name: 'QuotaExceededError' };
    repo.enqueueNextSave({ kind: 'storage_unavailable', cause });

    const outcome = await useCase.execute(validInputWith());

    expect(outcome.kind).toBe('storage_unavailable');
    if (outcome.kind !== 'storage_unavailable') return;
    expect(outcome.cause).toBe(cause);
  });
});
