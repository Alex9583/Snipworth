import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useExportImport } from '@/adapters/primary/library/useExportImport';
import { CountDrafts } from '@/application/use-cases/CountDrafts';
import { ExportAllDrafts } from '@/application/use-cases/ExportAllDrafts';
import { ImportDrafts } from '@/application/use-cases/ImportDrafts';
import type { DraftSnapshot } from '@/domain/drafts/Draft';

import { FakeClock } from '../../setup/fakes/FakeClock';
import { FixedIdGenerator } from '../../setup/fakes/FixedIdGenerator';
import { InMemoryDraftRepository } from '../../setup/fakes/InMemoryDraftRepository';
import { anActiveDraft } from '../../setup/mothers/DraftMother';

function bundleFile(snapshots: readonly DraftSnapshot[]): File {
  const bundle = { version: 1, exportedAt: 1_700_000_000_000, drafts: snapshots };
  return new File([JSON.stringify(bundle)], 'export.json', { type: 'application/json' });
}

async function setup(opts: { existing?: readonly string[]; file?: File } = {}) {
  const repo = new InMemoryDraftRepository();
  for (const id of opts.existing ?? []) {
    await repo.save(anActiveDraft({ id }));
  }
  const importDrafts = new ImportDrafts(repo, new FixedIdGenerator('imp'));
  const exportAllDrafts = new ExportAllDrafts(repo, new FakeClock());
  const countDrafts = new CountDrafts(repo);
  const onImported = vi.fn();
  const file = opts.file ?? bundleFile([anActiveDraft({ id: 'src' }).toSnapshot()]);
  const savedFiles: { json: string; filename: string }[] = [];

  const view = renderHook(() =>
    useExportImport({
      exportAllDrafts,
      importDrafts,
      countDrafts,
      clock: new FakeClock(),
      onImported,
      openFile: () => Promise.resolve<File | null>(file),
      saveFile: (json, filename) => savedFiles.push({ json, filename }),
    }),
  );

  return { repo, onImported, savedFiles, result: view.result };
}

async function idsInRepo(repo: InMemoryDraftRepository): Promise<readonly string[]> {
  const outcome = await repo.findAll();
  if (outcome.kind !== 'loaded') throw new Error('expected loaded');
  return outcome.drafts.map((d) => d.id).toSorted();
}

describe('useExportImport — import', () => {
  it('should_import_in_add_mode_immediately_when_the_library_is_empty', async () => {
    const { repo, onImported, result } = await setup({ existing: [] });

    act(() => {
      result.current.triggerImport();
    });

    await waitFor(() => {
      expect(result.current.importStatus).toEqual({ kind: 'imported', count: 1 });
    });
    expect(result.current.pendingImport).toBeNull();
    expect(await idsInRepo(repo)).toEqual(['imp-1']);
    expect(onImported).toHaveBeenCalledOnce();
  });

  it('should_stage_a_pending_import_without_writing_when_the_library_has_drafts', async () => {
    const { repo, onImported, result } = await setup({ existing: ['existing'] });

    act(() => {
      result.current.triggerImport();
    });

    await waitFor(() => {
      expect(result.current.pendingImport).toEqual({ incomingCount: 1 });
    });
    expect(result.current.importStatus).toBeNull();
    expect(await idsInRepo(repo)).toEqual(['existing']);
    expect(onImported).not.toHaveBeenCalled();
  });

  it('should_replace_the_library_when_the_pending_import_is_confirmed_as_replace', async () => {
    const { repo, result } = await setup({ existing: ['existing'] });
    act(() => {
      result.current.triggerImport();
    });
    await waitFor(() => {
      expect(result.current.pendingImport).not.toBeNull();
    });

    act(() => {
      result.current.confirmImport('replace');
    });

    await waitFor(() => {
      expect(result.current.importStatus).toEqual({ kind: 'imported', count: 1 });
    });
    expect(result.current.pendingImport).toBeNull();
    expect(await idsInRepo(repo)).toEqual(['imp-1']);
  });

  it('should_keep_existing_drafts_when_the_pending_import_is_confirmed_as_add', async () => {
    const { repo, result } = await setup({ existing: ['existing'] });
    act(() => {
      result.current.triggerImport();
    });
    await waitFor(() => {
      expect(result.current.pendingImport).not.toBeNull();
    });

    act(() => {
      result.current.confirmImport('add');
    });

    await waitFor(() => {
      expect(result.current.importStatus).toEqual({ kind: 'imported', count: 1 });
    });
    expect(await idsInRepo(repo)).toEqual(['existing', 'imp-1']);
  });

  it('should_discard_the_pending_import_when_cancelled', async () => {
    const { repo, onImported, result } = await setup({ existing: ['existing'] });
    act(() => {
      result.current.triggerImport();
    });
    await waitFor(() => {
      expect(result.current.pendingImport).not.toBeNull();
    });

    act(() => {
      result.current.cancelImport();
    });

    expect(result.current.pendingImport).toBeNull();
    expect(result.current.importStatus).toBeNull();
    expect(await idsInRepo(repo)).toEqual(['existing']);
    expect(onImported).not.toHaveBeenCalled();
  });

  it('should_stage_a_pending_import_rather_than_auto_add_when_the_draft_count_is_unavailable', async () => {
    const { repo, result } = await setup({ existing: [] });
    repo.failNextCountAllWith(new Error('storage down'));

    act(() => {
      result.current.triggerImport();
    });

    await waitFor(() => {
      expect(result.current.pendingImport).toEqual({ incomingCount: 1 });
    });
    expect(result.current.importStatus).toBeNull();
  });

  it('should_report_an_invalid_file_when_the_json_is_not_a_valid_bundle', async () => {
    const file = new File(['{"version":99}'], 'broken.json', { type: 'application/json' });
    const { result } = await setup({ file });

    act(() => {
      result.current.triggerImport();
    });

    await waitFor(() => {
      expect(result.current.importStatus?.kind).toBe('invalid_file');
    });
    expect(result.current.pendingImport).toBeNull();
  });
});

describe('useExportImport — export', () => {
  it('should_download_the_serialized_library_when_export_succeeds', async () => {
    const { savedFiles, result } = await setup({ existing: ['kept'] });

    act(() => {
      result.current.triggerExport();
    });

    await waitFor(() => {
      expect(result.current.exportStatus).toEqual({ kind: 'exported' });
    });
    expect(savedFiles).toHaveLength(1);
    const saved = savedFiles[0];
    if (saved === undefined) throw new Error('expected a saved file');
    expect(saved.filename).toMatch(/^snipworth-export-.+\.json$/);
    const bundle: unknown = JSON.parse(saved.json);
    expect(bundle).toMatchObject({ version: 1 });
    const drafts = (bundle as { drafts: { id: string }[] }).drafts;
    expect(drafts.map((d) => d.id)).toEqual(['kept']);
  });

  it('should_report_empty_without_downloading_when_there_is_nothing_to_export', async () => {
    const { savedFiles, result } = await setup({ existing: [] });

    act(() => {
      result.current.triggerExport();
    });

    await waitFor(() => {
      expect(result.current.exportStatus).toEqual({ kind: 'empty' });
    });
    expect(savedFiles).toHaveLength(0);
  });

  it('should_report_export_failed_without_downloading_when_storage_is_unavailable', async () => {
    const { repo, savedFiles, result } = await setup({ existing: ['kept'] });
    repo.failNextFindAllWith(new Error('disk gone'));

    act(() => {
      result.current.triggerExport();
    });

    await waitFor(() => {
      expect(result.current.exportStatus?.kind).toBe('export_failed');
    });
    expect(savedFiles).toHaveLength(0);
  });
});
