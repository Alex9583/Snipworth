import { describe, expect, it } from 'vitest';
import { ListDrafts } from '@/application/use-cases/ListDrafts';
import { Draft, type DraftStatus } from '@/domain/drafts/Draft';
import type { DraftId } from '@/domain/drafts/DraftId';
import type { Platform } from '@/domain/drafts/Platform';
import { RenderConfig } from '@/domain/rendering/RenderConfig';
import { InMemoryDraftRepository } from '../../../setup/fakes/InMemoryDraftRepository';

const CREATED_AT = new Date('2026-05-15T10:00:00Z');

interface DraftOverrides {
  readonly id?: string;
  readonly status?: DraftStatus;
  readonly title?: string;
  readonly caption?: string;
  readonly hashtags?: readonly string[];
  readonly platform?: Platform;
  readonly language?: string;
}

function aDraftAt(updatedAt: Date, overrides: DraftOverrides = {}): Draft {
  return Draft.fromSnapshot({
    id: overrides.id ?? 'draft-1',
    title: overrides.title ?? 'Hello',
    code: 'const x = 1;',
    language: overrides.language ?? 'typescript',
    config: RenderConfig.default().toSnapshot(),
    caption: overrides.caption ?? '',
    hashtags: overrides.hashtags ?? [],
    platform: overrides.platform ?? 'x',
    status: overrides.status ?? 'draft',
    createdAt: CREATED_AT.getTime(),
    updatedAt: updatedAt.getTime(),
  });
}

describe('ListDrafts', () => {
  it('should_return_loaded_with_empty_snapshots_and_empty_corrupt_when_the_repository_is_empty', async () => {
    const repo = new InMemoryDraftRepository();
    const useCase = new ListDrafts(repo);

    const outcome = await useCase.execute({});

    expect(outcome).toEqual({ kind: 'loaded', snapshots: [], corrupt: [] });
  });

  it('should_return_snapshots_sorted_by_updatedAt_DESC_when_no_filter_is_provided', async () => {
    const repo = new InMemoryDraftRepository();
    const draftA = aDraftAt(new Date('2026-05-15T10:00:00Z'), { id: 'draft-A' });
    const draftB = aDraftAt(new Date('2026-05-15T10:30:00Z'), { id: 'draft-B' });
    const draftC = aDraftAt(new Date('2026-05-15T10:15:00Z'), { id: 'draft-C' });
    await repo.save(draftA);
    await repo.save(draftB);
    await repo.save(draftC);
    const useCase = new ListDrafts(repo);

    const outcome = await useCase.execute({});

    expect(outcome.kind).toBe('loaded');
    if (outcome.kind !== 'loaded') return;
    expect(outcome.snapshots.map((s) => s.id as DraftId)).toEqual([
      'draft-B',
      'draft-C',
      'draft-A',
    ]);
  });

  it('should_break_ties_on_updatedAt_by_id_ascending_when_two_drafts_share_the_same_updatedAt', async () => {
    const repo = new InMemoryDraftRepository();
    const sameInstant = new Date('2026-05-15T10:30:00Z');
    await repo.save(aDraftAt(sameInstant, { id: 'draft-Z' }));
    await repo.save(aDraftAt(sameInstant, { id: 'draft-A' }));
    await repo.save(aDraftAt(sameInstant, { id: 'draft-M' }));
    const useCase = new ListDrafts(repo);

    const outcome = await useCase.execute({});

    expect(outcome.kind).toBe('loaded');
    if (outcome.kind !== 'loaded') return;
    expect(outcome.snapshots.map((s) => s.id as DraftId)).toEqual([
      'draft-A',
      'draft-M',
      'draft-Z',
    ]);
  });

  it('should_exclude_archived_drafts_when_no_status_filter_is_provided', async () => {
    const repo = new InMemoryDraftRepository();
    const t = new Date('2026-05-15T10:30:00Z');
    await repo.save(aDraftAt(t, { id: 'draft-active-1', status: 'draft' }));
    await repo.save(aDraftAt(t, { id: 'draft-active-2', status: 'draft' }));
    await repo.save(aDraftAt(t, { id: 'draft-arch-1', status: 'archived' }));
    await repo.save(aDraftAt(t, { id: 'draft-arch-2', status: 'archived' }));
    const useCase = new ListDrafts(repo);

    const outcome = await useCase.execute({});

    expect(outcome.kind).toBe('loaded');
    if (outcome.kind !== 'loaded') return;
    expect(outcome.snapshots.map((s) => s.id as DraftId)).toEqual([
      'draft-active-1',
      'draft-active-2',
    ]);
  });

  it('should_return_only_archived_drafts_when_filters_status_is_archived', async () => {
    const repo = new InMemoryDraftRepository();
    const t = new Date('2026-05-15T10:30:00Z');
    await repo.save(aDraftAt(t, { id: 'draft-active-1', status: 'draft' }));
    await repo.save(aDraftAt(t, { id: 'draft-active-2', status: 'draft' }));
    await repo.save(aDraftAt(t, { id: 'draft-arch-1', status: 'archived' }));
    await repo.save(aDraftAt(t, { id: 'draft-arch-2', status: 'archived' }));
    await repo.save(aDraftAt(t, { id: 'draft-arch-3', status: 'archived' }));
    const useCase = new ListDrafts(repo);

    const outcome = await useCase.execute({ filters: { status: 'archived' } });

    expect(outcome.kind).toBe('loaded');
    if (outcome.kind !== 'loaded') return;
    expect(outcome.snapshots.map((s) => s.id as DraftId)).toEqual([
      'draft-arch-1',
      'draft-arch-2',
      'draft-arch-3',
    ]);
  });

  it('should_return_drafts_whose_title_contains_the_search_term_case_insensitive_when_filters_search_is_set', async () => {
    const repo = new InMemoryDraftRepository();
    const t = new Date('2026-05-15T10:30:00Z');
    await repo.save(aDraftAt(t, { id: 'draft-hello-world', title: 'Hello world' }));
    await repo.save(aDraftAt(t, { id: 'draft-goodbye', title: 'Goodbye' }));
    await repo.save(aDraftAt(t, { id: 'draft-helloween', title: 'helloween' }));
    const useCase = new ListDrafts(repo);

    const outcome = await useCase.execute({ filters: { search: 'hello' } });

    expect(outcome.kind).toBe('loaded');
    if (outcome.kind !== 'loaded') return;
    expect(outcome.snapshots.map((s) => s.id as DraftId)).toEqual([
      'draft-hello-world',
      'draft-helloween',
    ]);
  });

  it('should_return_drafts_whose_caption_contains_the_search_term_case_insensitive_when_no_title_matches', async () => {
    const repo = new InMemoryDraftRepository();
    const t = new Date('2026-05-15T10:30:00Z');
    await repo.save(aDraftAt(t, { id: 'draft-misc', title: 'Foo', caption: 'unrelated text' }));
    await repo.save(
      aDraftAt(t, { id: 'draft-with-cap', title: 'Bar', caption: 'I LOVE LinkedIn snippets' }),
    );
    await repo.save(aDraftAt(t, { id: 'draft-other', title: 'Baz', caption: 'nothing here' }));
    const useCase = new ListDrafts(repo);

    const outcome = await useCase.execute({ filters: { search: 'linkedin' } });

    expect(outcome.kind).toBe('loaded');
    if (outcome.kind !== 'loaded') return;
    expect(outcome.snapshots.map((s) => s.id as DraftId)).toEqual(['draft-with-cap']);
  });

  it('should_return_drafts_whose_hashtags_contain_the_search_term_case_insensitive_when_title_and_caption_miss', async () => {
    const repo = new InMemoryDraftRepository();
    const t = new Date('2026-05-15T10:30:00Z');
    await repo.save(
      aDraftAt(t, {
        id: 'draft-tagged',
        title: 'Foo',
        caption: 'Bar',
        hashtags: ['#typescript', '#react'],
      }),
    );
    await repo.save(
      aDraftAt(t, { id: 'draft-untagged', title: 'Baz', caption: 'Qux', hashtags: [] }),
    );
    const useCase = new ListDrafts(repo);

    const outcome = await useCase.execute({ filters: { search: 'typescript' } });

    expect(outcome.kind).toBe('loaded');
    if (outcome.kind !== 'loaded') return;
    expect(outcome.snapshots.map((s) => s.id as DraftId)).toEqual(['draft-tagged']);
  });

  it('should_not_match_when_the_search_term_spans_a_field_boundary', async () => {
    const repo = new InMemoryDraftRepository();
    const t = new Date('2026-05-15T10:30:00Z');
    await repo.save(aDraftAt(t, { id: 'draft-cross', title: 'Foo', caption: 'LinkedIn' }));
    const useCase = new ListDrafts(repo);

    const outcome = await useCase.execute({ filters: { search: 'o l' } });

    expect(outcome.kind).toBe('loaded');
    if (outcome.kind !== 'loaded') return;
    expect(outcome.snapshots).toEqual([]);
  });

  it('should_return_only_drafts_matching_the_requested_platform_when_filters_platform_is_set', async () => {
    const repo = new InMemoryDraftRepository();
    const t = new Date('2026-05-15T10:30:00Z');
    await repo.save(aDraftAt(t, { id: 'draft-x-1', platform: 'x' }));
    await repo.save(aDraftAt(t, { id: 'draft-x-2', platform: 'x' }));
    await repo.save(aDraftAt(t, { id: 'draft-li', platform: 'linkedin' }));
    const useCase = new ListDrafts(repo);

    const outcome = await useCase.execute({ filters: { platform: 'linkedin' } });

    expect(outcome.kind).toBe('loaded');
    if (outcome.kind !== 'loaded') return;
    expect(outcome.snapshots.map((s) => s.id as DraftId)).toEqual(['draft-li']);
  });

  it('should_return_only_drafts_matching_the_requested_language_when_filters_language_is_set', async () => {
    const repo = new InMemoryDraftRepository();
    const t = new Date('2026-05-15T10:30:00Z');
    await repo.save(aDraftAt(t, { id: 'draft-ts-1', language: 'typescript' }));
    await repo.save(aDraftAt(t, { id: 'draft-py', language: 'python' }));
    await repo.save(aDraftAt(t, { id: 'draft-ts-2', language: 'typescript' }));
    const useCase = new ListDrafts(repo);

    const outcome = await useCase.execute({ filters: { language: 'typescript' } });

    expect(outcome.kind).toBe('loaded');
    if (outcome.kind !== 'loaded') return;
    expect(outcome.snapshots.map((s) => s.id as DraftId)).toEqual(['draft-ts-1', 'draft-ts-2']);
  });

  it('should_return_drafts_having_at_least_one_of_the_requested_tags_when_filters_tags_is_non_empty', async () => {
    const repo = new InMemoryDraftRepository();
    const t = new Date('2026-05-15T10:30:00Z');
    await repo.save(aDraftAt(t, { id: 'draft-D1', hashtags: ['#work', '#snippet'] }));
    await repo.save(aDraftAt(t, { id: 'draft-D2', hashtags: ['#demo', '#tutorial'] }));
    await repo.save(aDraftAt(t, { id: 'draft-D3', hashtags: ['#snippet'] }));
    await repo.save(aDraftAt(t, { id: 'draft-D4', hashtags: [] }));
    const useCase = new ListDrafts(repo);

    const outcome = await useCase.execute({ filters: { tags: ['work', 'tutorial'] } });

    expect(outcome.kind).toBe('loaded');
    if (outcome.kind !== 'loaded') return;
    expect(outcome.snapshots.map((s) => s.id as DraftId)).toEqual(['draft-D1', 'draft-D2']);
  });

  it('should_apply_no_tag_filter_when_filters_tags_is_an_empty_array', async () => {
    const repo = new InMemoryDraftRepository();
    const t = new Date('2026-05-15T10:30:00Z');
    await repo.save(aDraftAt(t, { id: 'draft-A', hashtags: ['#work'] }));
    await repo.save(aDraftAt(t, { id: 'draft-B', hashtags: [] }));
    const useCase = new ListDrafts(repo);

    const outcome = await useCase.execute({ filters: { tags: [] } });

    expect(outcome.kind).toBe('loaded');
    if (outcome.kind !== 'loaded') return;
    expect(outcome.snapshots.map((s) => s.id as DraftId)).toEqual(['draft-A', 'draft-B']);
  });

  it('should_AND_combine_platform_language_and_tags_filters_when_all_three_are_set', async () => {
    const repo = new InMemoryDraftRepository();
    const t = new Date('2026-05-15T10:30:00Z');
    await repo.save(
      aDraftAt(t, {
        id: 'draft-match',
        platform: 'linkedin',
        language: 'typescript',
        hashtags: ['#work'],
      }),
    );
    await repo.save(
      aDraftAt(t, {
        id: 'draft-wrong-platform',
        platform: 'x',
        language: 'typescript',
        hashtags: ['#work'],
      }),
    );
    await repo.save(
      aDraftAt(t, {
        id: 'draft-wrong-language',
        platform: 'linkedin',
        language: 'python',
        hashtags: ['#work'],
      }),
    );
    await repo.save(
      aDraftAt(t, {
        id: 'draft-wrong-tags',
        platform: 'linkedin',
        language: 'typescript',
        hashtags: ['#demo'],
      }),
    );
    await repo.save(
      aDraftAt(t, {
        id: 'draft-none',
        platform: 'instagram',
        language: 'rust',
        hashtags: ['#fun'],
      }),
    );
    const useCase = new ListDrafts(repo);

    const outcome = await useCase.execute({
      filters: { platform: 'linkedin', language: 'typescript', tags: ['work'] },
    });

    expect(outcome.kind).toBe('loaded');
    if (outcome.kind !== 'loaded') return;
    expect(outcome.snapshots.map((s) => s.id as DraftId)).toEqual(['draft-match']);
  });

  it('should_separate_corrupt_rows_from_valid_snapshots_and_report_both_when_findAll_returns_a_mix', async () => {
    const repo = new InMemoryDraftRepository();
    const t = new Date('2026-05-15T10:30:00Z');
    await repo.save(aDraftAt(t, { id: 'draft-ok-1' }));
    await repo.save(aDraftAt(t, { id: 'draft-ok-2' }));
    await repo.save(aDraftAt(t, { id: 'draft-ok-3' }));
    const cause = { issues: [{ path: ['code'], message: 'expected string' }] };
    repo.seedCorruptRow('draft-bad' as DraftId, cause);
    const useCase = new ListDrafts(repo);

    const outcome = await useCase.execute({});

    expect(outcome.kind).toBe('loaded');
    if (outcome.kind !== 'loaded') return;
    expect(outcome.snapshots.map((s) => s.id as DraftId)).toEqual([
      'draft-ok-1',
      'draft-ok-2',
      'draft-ok-3',
    ]);
    expect(outcome.corrupt).toEqual([{ id: 'draft-bad', cause }]);
  });

  it('should_report_corrupt_rows_independent_of_status_filter_when_findAll_returns_a_mix', async () => {
    const repo = new InMemoryDraftRepository();
    const t = new Date('2026-05-15T10:30:00Z');
    await repo.save(aDraftAt(t, { id: 'draft-active', status: 'draft' }));
    await repo.save(aDraftAt(t, { id: 'draft-archived', status: 'archived' }));
    const cause = { issues: [{ path: ['code'], message: 'expected string' }] };
    repo.seedCorruptRow('draft-bad' as DraftId, cause);
    const useCase = new ListDrafts(repo);

    const outcome = await useCase.execute({ filters: { status: 'archived' } });

    expect(outcome.kind).toBe('loaded');
    if (outcome.kind !== 'loaded') return;
    expect(outcome.snapshots.map((s) => s.id as DraftId)).toEqual(['draft-archived']);
    expect(outcome.corrupt).toEqual([{ id: 'draft-bad', cause }]);
  });

  it('should_return_empty_snapshots_and_full_corrupt_list_when_all_rows_are_corrupt', async () => {
    const repo = new InMemoryDraftRepository();
    const cause1 = { issues: [{ path: ['code'], message: 'expected string' }] };
    const cause2 = { issues: [{ path: ['title'], message: 'too long' }] };
    repo.seedCorruptRow('draft-bad-1' as DraftId, cause1);
    repo.seedCorruptRow('draft-bad-2' as DraftId, cause2);
    const useCase = new ListDrafts(repo);

    const outcome = await useCase.execute({});

    expect(outcome.kind).toBe('loaded');
    if (outcome.kind !== 'loaded') return;
    expect(outcome.snapshots).toEqual([]);
    expect(outcome.corrupt).toEqual(
      expect.arrayContaining([
        { id: 'draft-bad-1', cause: cause1 },
        { id: 'draft-bad-2', cause: cause2 },
      ]),
    );
    expect(outcome.corrupt).toHaveLength(2);
  });

  it('should_return_storage_unavailable_carrying_the_repo_thrown_cause_when_findAll_throws', async () => {
    const repo = new InMemoryDraftRepository();
    const thrown = new Error('dexie connection lost');
    repo.failNextFindAllWith(thrown);
    const useCase = new ListDrafts(repo);

    const outcome = await useCase.execute({});

    expect(outcome.kind).toBe('storage_unavailable');
    if (outcome.kind !== 'storage_unavailable') return;
    expect(outcome.cause).toBe(thrown);
  });

  it('should_return_storage_unavailable_carrying_the_repo_typed_cause_when_findAll_returns_storage_unavailable', async () => {
    const repo = new InMemoryDraftRepository();
    const cause = { code: 'QuotaExceededError', name: 'QuotaExceededError' };
    repo.enqueueNextFindAllOutcome({ kind: 'storage_unavailable', cause });
    const useCase = new ListDrafts(repo);

    const outcome = await useCase.execute({});

    expect(outcome.kind).toBe('storage_unavailable');
    if (outcome.kind !== 'storage_unavailable') return;
    expect(outcome.cause).toBe(cause);
  });
});
