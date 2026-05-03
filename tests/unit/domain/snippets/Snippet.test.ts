import { describe, it, expect } from 'vitest';
import {
  InvalidSnippet,
  Snippet,
  type SnippetCreateInput,
  type SnippetSnapshot,
} from '@/domain/snippets/Snippet';
import type { SnippetId } from '@/domain/snippets/SnippetId';

const CREATED_AT = new Date('2026-03-15T10:00:00.000Z');
const LATER = new Date('2026-03-15T10:30:00.000Z');

function buildInput(overrides: Partial<SnippetCreateInput> = {}): SnippetCreateInput {
  return {
    id: 'snippet-1' as SnippetId,
    title: 'Hello',
    code: 'print("hi")',
    language: 'python',
    tags: ['demo'],
    createdAt: CREATED_AT,
    ...overrides,
  };
}

describe('Snippet.create — happy path', () => {
  it('should_carry_every_input_field_into_the_aggregate', () => {
    const snippet = Snippet.create(buildInput());
    expect(snippet.id).toBe('snippet-1');
    expect(snippet.title).toBe('Hello');
    expect(snippet.code).toBe('print("hi")');
    expect(snippet.language).toBe('python');
    expect(snippet.tags).toEqual(['demo']);
  });

  it('should_align_updatedAt_with_createdAt_on_creation', () => {
    const snippet = Snippet.create(buildInput());
    expect(snippet.updatedAt.getTime()).toBe(snippet.createdAt.getTime());
  });

  it('should_isolate_createdAt_and_tags_from_caller_mutation_after_construction', () => {
    const tags = ['demo'];
    const mutable = new Date(CREATED_AT);
    const snippet = Snippet.create(buildInput({ tags, createdAt: mutable }));
    tags.push('mutation');
    mutable.setFullYear(1999);
    expect(snippet.tags).toEqual(['demo']);
    expect(snippet.createdAt.getFullYear()).toBe(2026);
  });

  it('should_accept_an_empty_title', () => {
    const snippet = Snippet.create(buildInput({ title: '' }));
    expect(snippet.title).toBe('');
  });
});

describe('Snippet.create — invariants', () => {
  it('should_reject_an_empty_id', () => {
    expect(() => Snippet.create(buildInput({ id: '' as SnippetId }))).toThrow(InvalidSnippet);
  });

  it('should_reject_an_empty_language', () => {
    expect(() => Snippet.create(buildInput({ language: '' }))).toThrow(/language/);
  });

  it('should_reject_a_non_finite_createdAt', () => {
    expect(() => Snippet.create(buildInput({ createdAt: new Date(Number.NaN) }))).toThrow(
      /createdAt/,
    );
  });

  it('should_reject_a_title_exceeding_200_characters', () => {
    expect(() => Snippet.create(buildInput({ title: 'x'.repeat(201) }))).toThrow(/title/);
  });

  it('should_reject_a_code_exceeding_200_000_characters', () => {
    expect(() => Snippet.create(buildInput({ code: 'x'.repeat(200_001) }))).toThrow(/code/);
  });

  it('should_reject_more_than_50_tags', () => {
    const many = Array.from({ length: 51 }, (_, i) => `tag${String(i)}`);
    expect(() => Snippet.create(buildInput({ tags: many }))).toThrow(/tags/);
  });

  it('should_reject_empty_or_duplicate_tags', () => {
    expect(() => Snippet.create(buildInput({ tags: ['ok', ''] }))).toThrow(/tags/);
    expect(() => Snippet.create(buildInput({ tags: ['demo', 'demo'] }))).toThrow(/tags/);
  });
});

describe('Snippet.fromSnapshot / toSnapshot', () => {
  it('should_render_dates_as_epoch_milliseconds_in_the_snapshot', () => {
    const snippet = Snippet.create(buildInput());
    expect(snippet.toSnapshot().createdAt).toBe(CREATED_AT.getTime());
    expect(snippet.toSnapshot().updatedAt).toBe(CREATED_AT.getTime());
  });

  it('should_round_trip_a_snapshot_back_to_an_equivalent_snippet', () => {
    const original = Snippet.create(buildInput());
    const round = Snippet.fromSnapshot(original.toSnapshot());
    expect(round.toSnapshot()).toEqual(original.toSnapshot());
  });

  it('should_let_fromSnapshot_carry_a_persisted_updatedAt_distinct_from_createdAt', () => {
    const snapshot: SnippetSnapshot = {
      id: 'snippet-1',
      title: 'Hello',
      code: 'print("hi")',
      language: 'python',
      tags: ['demo'],
      createdAt: CREATED_AT.getTime(),
      updatedAt: LATER.getTime(),
    };
    const snippet = Snippet.fromSnapshot(snapshot);
    expect(snippet.createdAt.getTime()).toBe(CREATED_AT.getTime());
    expect(snippet.updatedAt.getTime()).toBe(LATER.getTime());
  });
});
