// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

import { DexieSnippetRepository } from '@/adapters/secondary/dexie/DexieSnippetRepository';
import { createSnipworthDB, type SnipworthDB } from '@/adapters/secondary/dexie/SnipworthDB';
import { Snippet, type SnippetCreateInput } from '@/domain/snippets/Snippet';
import type { SnippetId } from '@/domain/snippets/SnippetId';

const CREATED_AT = new Date('2026-03-15T10:00:00.000Z');

function buildSnippet(overrides: Partial<SnippetCreateInput> = {}): Snippet {
  return Snippet.create({
    id: 'snippet-1' as SnippetId,
    title: 'Hello',
    code: 'print("hi")',
    language: 'python',
    tags: ['demo'],
    createdAt: CREATED_AT,
    ...overrides,
  });
}

let db: SnipworthDB;

beforeAll(() => {
  db = createSnipworthDB(`SnipworthDB-test-snippets-${crypto.randomUUID()}`);
});

afterAll(async () => {
  await db.delete();
});

beforeEach(async () => {
  await db.snippets.clear();
});

describe('DexieSnippetRepository.save / findById', () => {
  it('should_round_trip_a_saved_snippet_through_findById', async () => {
    const repo = new DexieSnippetRepository(db);
    const snippet = buildSnippet();

    expect(await repo.save(snippet)).toEqual({ kind: 'saved' });

    const found = await repo.findById(snippet.id);
    expect(found.kind).toBe('found');
    if (found.kind === 'found') {
      expect(found.snippet.toSnapshot()).toEqual(snippet.toSnapshot());
    }
  });

  it('should_return_not_found_when_no_snippet_exists_for_the_given_id', async () => {
    const repo = new DexieSnippetRepository(db);
    expect((await repo.findById('missing' as SnippetId)).kind).toBe('not_found');
  });
});

describe('DexieSnippetRepository.findAll', () => {
  it('should_return_every_persisted_snippet_when_no_filter_is_given', async () => {
    const repo = new DexieSnippetRepository(db);
    await repo.save(buildSnippet({ id: 'a' as SnippetId, language: 'typescript' }));
    await repo.save(buildSnippet({ id: 'b' as SnippetId, language: 'python' }));

    const outcome = await repo.findAll();
    expect(outcome.kind).toBe('loaded');
    if (outcome.kind === 'loaded') {
      expect(outcome.snippets.map((s) => s.id).toSorted()).toEqual(['a', 'b']);
    }
  });

  it('should_filter_by_language_when_a_filter_is_given', async () => {
    const repo = new DexieSnippetRepository(db);
    await repo.save(buildSnippet({ id: 'a' as SnippetId, language: 'typescript' }));
    await repo.save(buildSnippet({ id: 'b' as SnippetId, language: 'python' }));
    await repo.save(buildSnippet({ id: 'c' as SnippetId, language: 'python' }));

    const outcome = await repo.findAll({ language: 'python' });
    expect(outcome.kind).toBe('loaded');
    if (outcome.kind === 'loaded') {
      expect(outcome.snippets.map((s) => s.id).toSorted()).toEqual(['b', 'c']);
    }
  });

  it('should_isolate_corrupt_rows_so_valid_snippets_still_load', async () => {
    const repo = new DexieSnippetRepository(db);
    await repo.save(buildSnippet({ id: 'valid' as SnippetId }));
    await db.snippets.put({
      id: 'broken',
    } as unknown as Parameters<typeof db.snippets.put>[0]);

    const outcome = await repo.findAll();
    expect(outcome.kind).toBe('loaded');
    if (outcome.kind === 'loaded') {
      expect(outcome.snippets.map((s) => s.id)).toEqual(['valid']);
      expect(outcome.corrupt).toHaveLength(1);
      expect(outcome.corrupt[0]?.id).toBe('broken');
    }
  });
});

describe('DexieSnippetRepository.delete', () => {
  it('should_remove_a_persisted_snippet', async () => {
    const repo = new DexieSnippetRepository(db);
    const snippet = buildSnippet();
    await repo.save(snippet);

    expect(await repo.delete(snippet.id)).toEqual({ kind: 'deleted' });
    expect((await repo.findById(snippet.id)).kind).toBe('not_found');
  });

  it('should_report_deleted_even_when_no_row_existed', async () => {
    const repo = new DexieSnippetRepository(db);
    const outcome = await repo.delete('missing' as SnippetId);
    expect(outcome).toEqual({ kind: 'deleted' });
  });
});

describe('DexieSnippetRepository — corrupt findById', () => {
  it('should_return_corrupt_when_the_row_does_not_match_the_schema', async () => {
    const repo = new DexieSnippetRepository(db);
    await db.snippets.put({
      id: 'broken',
    } as unknown as Parameters<typeof db.snippets.put>[0]);

    const outcome = await repo.findById('broken' as SnippetId);
    expect(outcome.kind).toBe('corrupt');
  });
});
