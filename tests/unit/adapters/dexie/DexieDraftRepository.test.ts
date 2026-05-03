// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

import { DexieDraftRepository } from '@/adapters/secondary/dexie/DexieDraftRepository';
import { createSnipworthDB, type SnipworthDB } from '@/adapters/secondary/dexie/SnipworthDB';
import { Draft, type DraftCreateInput } from '@/domain/drafts/Draft';
import type { DraftId } from '@/domain/drafts/DraftId';
import { RenderConfig, type RenderConfigInput } from '@/domain/rendering/RenderConfig';

const CREATED_AT = new Date('2026-03-15T10:00:00.000Z');

const baseConfig: RenderConfigInput = {
  theme: 'github-dark',
  fontFamily: 'JetBrains Mono',
  fontSize: 14,
  lineHeight: 1.5,
  paddingX: 24,
  paddingY: 24,
  borderRadius: 8,
  background: { type: 'solid', color: '#1e1e1e' },
  showWindowControls: true,
  windowStyle: 'mac',
  showLineNumbers: false,
  firstLineNumber: 1,
  highlightLines: [],
  shadow: true,
  shadowBlur: 10,
  shadowOffsetY: 4,
  aspectRatio: 'auto',
  exportScale: 2,
  exportFormat: 'png',
};

function buildDraft(overrides: Partial<DraftCreateInput> = {}): Draft {
  return Draft.create({
    id: 'draft-1' as DraftId,
    title: 'Hello',
    code: 'const x = 1;',
    language: 'typescript',
    config: RenderConfig.from(baseConfig),
    caption: '',
    hashtags: [],
    platform: 'x',
    thumbnail: null,
    tags: ['demo'],
    createdAt: CREATED_AT,
    ...overrides,
  });
}

let db: SnipworthDB;

beforeAll(() => {
  db = createSnipworthDB(`SnipworthDB-test-drafts-${crypto.randomUUID()}`);
});

afterAll(async () => {
  await db.delete();
});

beforeEach(async () => {
  await db.drafts.clear();
});

describe('DexieDraftRepository.save / findById', () => {
  it('should_round_trip_a_saved_draft_through_findById', async () => {
    const repo = new DexieDraftRepository(db);
    const draft = buildDraft();

    const saved = await repo.save(draft);
    expect(saved).toEqual({ kind: 'saved' });

    const found = await repo.findById(draft.id);
    expect(found.kind).toBe('found');
    if (found.kind === 'found') {
      expect(found.draft.toSnapshot()).toEqual(draft.toSnapshot());
    }
  });

  it('should_return_not_found_when_no_draft_exists_for_the_given_id', async () => {
    const repo = new DexieDraftRepository(db);
    const outcome = await repo.findById('missing' as DraftId);
    expect(outcome.kind).toBe('not_found');
  });

  it('should_overwrite_an_existing_draft_when_saving_the_same_id_twice', async () => {
    const repo = new DexieDraftRepository(db);
    const original = buildDraft({ title: 'First' });
    await repo.save(original);

    const renamed = original.rename('Second', new Date(CREATED_AT.getTime() + 60_000));
    await repo.save(renamed);

    const found = await repo.findById(original.id);
    expect(found.kind).toBe('found');
    if (found.kind === 'found') {
      expect(found.draft.title).toBe('Second');
    }
  });

  it('should_round_trip_a_blob_thumbnail', async () => {
    const repo = new DexieDraftRepository(db);
    const blob = new Blob(['png-bytes'], { type: 'image/png' });
    const draft = buildDraft({ thumbnail: blob });

    await repo.save(draft);
    const found = await repo.findById(draft.id);

    expect(found.kind).toBe('found');
    if (found.kind === 'found') {
      expect(found.draft.thumbnail).toBeInstanceOf(Blob);
      expect(found.draft.thumbnail?.type).toBe('image/png');
      const text = await found.draft.thumbnail?.text();
      expect(text).toBe('png-bytes');
    }
  });
});

describe('DexieDraftRepository.findAll', () => {
  it('should_return_an_empty_loaded_outcome_when_no_drafts_exist', async () => {
    const repo = new DexieDraftRepository(db);
    const outcome = await repo.findAll();
    expect(outcome).toEqual({ kind: 'loaded', drafts: [], corrupt: [] });
  });

  it('should_return_every_persisted_draft', async () => {
    const repo = new DexieDraftRepository(db);
    const a = buildDraft({ id: 'a' as DraftId, title: 'Alpha' });
    const b = buildDraft({ id: 'b' as DraftId, title: 'Beta' });
    await repo.save(a);
    await repo.save(b);

    const outcome = await repo.findAll();
    expect(outcome.kind).toBe('loaded');
    if (outcome.kind === 'loaded') {
      const titles = outcome.drafts.map((d) => d.title).toSorted();
      expect(titles).toEqual(['Alpha', 'Beta']);
      expect(outcome.corrupt).toEqual([]);
    }
  });

  it('should_isolate_corrupt_rows_so_valid_drafts_still_load', async () => {
    const repo = new DexieDraftRepository(db);
    const valid = buildDraft({ id: 'valid' as DraftId });
    await repo.save(valid);
    await db.drafts.put({
      id: 'broken',
      title: 'X',
    } as unknown as Parameters<typeof db.drafts.put>[0]);

    const outcome = await repo.findAll();
    expect(outcome.kind).toBe('loaded');
    if (outcome.kind === 'loaded') {
      expect(outcome.drafts.map((d) => d.id)).toEqual(['valid']);
      expect(outcome.corrupt).toHaveLength(1);
      expect(outcome.corrupt[0]?.id).toBe('broken');
    }
  });
});

describe('DexieDraftRepository.delete', () => {
  it('should_remove_a_persisted_draft', async () => {
    const repo = new DexieDraftRepository(db);
    const draft = buildDraft();
    await repo.save(draft);

    const deleted = await repo.delete(draft.id);
    expect(deleted).toEqual({ kind: 'deleted' });

    const found = await repo.findById(draft.id);
    expect(found.kind).toBe('not_found');
  });

  it('should_report_deleted_even_when_no_row_existed', async () => {
    const repo = new DexieDraftRepository(db);
    const outcome = await repo.delete('missing' as DraftId);
    expect(outcome).toEqual({ kind: 'deleted' });
  });
});

describe('DexieDraftRepository — corrupt findById', () => {
  it('should_return_corrupt_when_the_row_does_not_match_the_schema', async () => {
    const repo = new DexieDraftRepository(db);
    await db.drafts.put({
      id: 'broken',
      title: 'X',
    } as unknown as Parameters<typeof db.drafts.put>[0]);

    const outcome = await repo.findById('broken' as DraftId);
    expect(outcome.kind).toBe('corrupt');
  });
});
