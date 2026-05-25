// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { z } from 'zod';

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
  borderRadius: 8,
  background: { type: 'solid', color: '#1e1e1e' },
  canvasBackground: { type: 'solid', color: '#1e1e1e' },
  canvasPadding: 10,
  showWindowControls: true,
  windowStyle: 'mac',
  showLineNumbers: false,
  firstLineNumber: 1,
  highlightLines: [],
  shadow: true,
  shadowBlur: 10,
  shadowOffsetY: 4,
  aspectRatio: { kind: 'auto' },
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
    createdAt: CREATED_AT,
    ...overrides,
  });
}

type LegacyRowOverlay = { thumbnail: null } | { status: 'published' };

async function putLegacyRow(
  database: SnipworthDB,
  draftOverrides: Partial<DraftCreateInput>,
  overlay: LegacyRowOverlay,
): Promise<void> {
  await database.drafts.put({
    ...buildDraft(draftOverrides).toSnapshot(),
    ...overlay,
  } as unknown as Parameters<typeof database.drafts.put>[0]);
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
  it('should_round_trip_a_v2_draft_through_save_and_findById_with_snapshot_equality', async () => {
    const repo = new DexieDraftRepository(db);
    const created = buildDraft({
      id: 'roundtrip-draft' as DraftId,
      title: 'Roundtrip Title',
      code: 'function greet(name: string) {\n  return `Hello, ${name}!`;\n}',
      language: 'tsx',
      caption: 'roundtrip-caption',
      hashtags: ['#typescript', '#testing'],
      platform: 'linkedin',
    });
    const archived = created.archive(new Date(CREATED_AT.getTime() + 60_000));

    const saved = await repo.save(archived);
    expect(saved).toEqual({ kind: 'saved' });

    const found = await repo.findById(archived.id);
    expect(found.kind).toBe('found');
    if (found.kind === 'found') {
      expect(found.draft.toSnapshot()).toEqual(archived.toSnapshot());
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

  it('should_persist_a_v2_row_with_no_thumbnail_key_when_save_is_called_with_a_v2_draft', async () => {
    const repo = new DexieDraftRepository(db);
    const draft = buildDraft();

    await repo.save(draft);

    const row = await db.drafts.get(draft.id);
    expect(row).toBeDefined();
    expect(row).toEqual(draft.toSnapshot());
    expect(row).not.toHaveProperty('thumbnail');
  });

  it('should_overwrite_an_existing_row_with_a_v2_shape_and_no_thumbnail_key_when_save_is_called_twice_with_the_same_id', async () => {
    const repo = new DexieDraftRepository(db);
    const legacy = buildDraft({ title: 'Legacy' });
    await putLegacyRow(db, { title: 'Legacy' }, { thumbnail: null });

    const updated = legacy.rename('Updated', new Date(CREATED_AT.getTime() + 60_000));
    await repo.save(updated);

    const row = await db.drafts.get(legacy.id);
    expect(row).toBeDefined();
    expect(row).toEqual(updated.toSnapshot());
    expect(row).not.toHaveProperty('thumbnail');
  });
});

describe('DexieDraftRepository.findAll', () => {
  it('should_return_an_empty_loaded_outcome_when_no_drafts_exist', async () => {
    const repo = new DexieDraftRepository(db);
    const outcome = await repo.findAll();
    expect(outcome).toEqual({ kind: 'loaded', drafts: [], corrupt: [] });
  });

  it('should_return_three_drafts_with_no_corrupt_entries_when_findAll_runs_against_three_valid_v2_rows', async () => {
    const repo = new DexieDraftRepository(db);
    const a = buildDraft({ id: 'a' as DraftId, title: 'Alpha' });
    const b = buildDraft({ id: 'b' as DraftId, title: 'Beta' });
    const c = buildDraft({ id: 'c' as DraftId, title: 'Gamma' });
    await repo.save(a);
    await repo.save(b);
    await repo.save(c);

    const outcome = await repo.findAll();
    expect(outcome.kind).toBe('loaded');
    if (outcome.kind === 'loaded') {
      const titles = outcome.drafts.map((d) => d.title).toSorted();
      expect(titles).toEqual(['Alpha', 'Beta', 'Gamma']);
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

  it('should_split_valid_and_corrupt_rows_when_findAll_runs_against_a_mix_of_v2_and_legacy_rows', async () => {
    const repo = new DexieDraftRepository(db);
    const first = buildDraft({ id: 'draft-v2-1' as DraftId, title: 'First' });
    const second = buildDraft({ id: 'draft-v2-2' as DraftId, title: 'Second' });
    await repo.save(first);
    await repo.save(second);
    await putLegacyRow(
      db,
      { id: 'draft-legacy-1' as DraftId, title: 'Legacy' },
      { thumbnail: null },
    );

    const outcome = await repo.findAll();

    expect(outcome.kind).toBe('loaded');
    if (outcome.kind === 'loaded') {
      const ids = outcome.drafts.map((d) => d.id).toSorted();
      expect(ids).toEqual(['draft-v2-1', 'draft-v2-2']);
      expect(outcome.corrupt).toHaveLength(1);
      expect(outcome.corrupt[0]?.id).toBe('draft-legacy-1');
    }
  });

  it('should_return_only_corrupt_entries_when_findAll_runs_against_two_legacy_rows_with_distinct_failure_modes', async () => {
    const repo = new DexieDraftRepository(db);
    await putLegacyRow(
      db,
      { id: 'draft-legacy-1' as DraftId, title: 'WithThumbnail' },
      { thumbnail: null },
    );
    await putLegacyRow(
      db,
      { id: 'draft-legacy-2' as DraftId, title: 'Published' },
      { status: 'published' },
    );

    const outcome = await repo.findAll();

    expect(outcome.kind).toBe('loaded');
    if (outcome.kind === 'loaded') {
      expect(outcome.drafts).toEqual([]);
      const corruptIds = outcome.corrupt.map((row) => row.id).toSorted();
      expect(corruptIds).toEqual(['draft-legacy-1', 'draft-legacy-2']);
      for (const row of outcome.corrupt) {
        expect(row.cause).toBeInstanceOf(z.ZodError);
      }
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

  it('should_report_corrupt_with_a_ZodError_cause_when_a_legacy_row_with_thumbnail_is_read_via_findById', async () => {
    const repo = new DexieDraftRepository(db);
    await putLegacyRow(db, { id: 'draft-legacy-1' as DraftId }, { thumbnail: null });

    const outcome = await repo.findById('draft-legacy-1' as DraftId);

    expect(outcome.kind).toBe('corrupt');
    if (outcome.kind === 'corrupt') {
      expect(outcome.cause).toBeInstanceOf(z.ZodError);
      const cause = outcome.cause as z.ZodError;
      const unknownKeyIssue = cause.issues.find((i) => i.code === 'unrecognized_keys');
      expect(unknownKeyIssue).toBeDefined();
      expect(unknownKeyIssue?.keys).toContain('thumbnail');
    }
  });

  it('should_report_corrupt_with_a_ZodError_cause_when_a_row_with_status_published_is_read_via_findById', async () => {
    const repo = new DexieDraftRepository(db);
    await putLegacyRow(db, { id: 'draft-legacy-2' as DraftId }, { status: 'published' });

    const outcome = await repo.findById('draft-legacy-2' as DraftId);

    expect(outcome.kind).toBe('corrupt');
    if (outcome.kind === 'corrupt') {
      expect(outcome.cause).toBeInstanceOf(z.ZodError);
      const cause = outcome.cause as z.ZodError;
      const statusIssue = cause.issues.find(
        (i) => i.path[0] === 'status' && i.code === 'invalid_value',
      );
      expect(statusIssue).toBeDefined();
    }
  });
});
