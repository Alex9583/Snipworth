import { useCallback, useEffect, useRef, useState } from 'react';

import type { Clock } from '@/application/ports/Clock';
import type { CountDrafts } from '@/application/use-cases/CountDrafts';
import type { ExportAllDrafts } from '@/application/use-cases/ExportAllDrafts';
import type { ImportDrafts, ImportMode } from '@/application/use-cases/ImportDrafts';
import type { DraftSnapshot } from '@/domain/drafts/Draft';

import { exportBundleSchema } from './exportBundleSchema';
import { openJsonFile } from './openJsonFile';
import { saveJsonFile } from './saveJsonFile';

const STATUS_DISMISS_MS = 5000;

export type ExportOutcome =
  | { readonly kind: 'exported' }
  | { readonly kind: 'empty' }
  | { readonly kind: 'export_failed'; readonly cause: unknown };

export type ImportOutcome =
  | { readonly kind: 'imported'; readonly count: number }
  | { readonly kind: 'invalid_file'; readonly message: string }
  | { readonly kind: 'import_failed'; readonly cause: unknown };

export interface PendingImport {
  readonly incomingCount: number;
}

export interface UseExportImportInput {
  readonly exportAllDrafts: Pick<ExportAllDrafts, 'execute'>;
  readonly importDrafts: Pick<ImportDrafts, 'execute'>;
  readonly countDrafts: Pick<CountDrafts, 'execute'>;
  readonly clock: Pick<Clock, 'now'>;
  readonly onImported: () => void;
  readonly openFile?: () => Promise<File | null>;
  readonly saveFile?: (json: string, filename: string) => void;
}

export interface ExportImportHandle {
  readonly triggerExport: () => void;
  readonly exportStatus: ExportOutcome | null;
  readonly triggerImport: () => void;
  readonly importStatus: ImportOutcome | null;
  readonly pendingImport: PendingImport | null;
  readonly confirmImport: (mode: ImportMode) => void;
  readonly cancelImport: () => void;
}

type ParsedFile =
  | { readonly ok: true; readonly drafts: readonly DraftSnapshot[] }
  | { readonly ok: false; readonly message: string };

function buildJsonFilename(at: Date): string {
  const iso = at.toISOString().slice(0, 19).replace(/[T:]/g, '-');
  return `snipworth-export-${iso}.json`;
}

async function mayHaveExistingDrafts(countDrafts: Pick<CountDrafts, 'execute'>): Promise<boolean> {
  const outcome = await countDrafts.execute();
  return outcome.kind === 'storage_unavailable' || outcome.total > 0;
}

async function parseImportFile(file: File): Promise<ParsedFile> {
  const text = await file.text();
  const raw: unknown = JSON.parse(text);
  const parsed = exportBundleSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.message };
  }
  return { ok: true, drafts: parsed.data.drafts };
}

export function useExportImport(input: UseExportImportInput): ExportImportHandle {
  const { exportAllDrafts, importDrafts, countDrafts, clock, onImported } = input;

  const [exportStatus, setExportStatus] = useState<ExportOutcome | null>(null);
  const [importStatus, setImportStatus] = useState<ImportOutcome | null>(null);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);

  const onImportedRef = useRef(onImported);
  onImportedRef.current = onImported;
  const openFileRef = useRef(input.openFile ?? openJsonFile);
  openFileRef.current = input.openFile ?? openJsonFile;
  const saveFileRef = useRef(input.saveFile ?? saveJsonFile);
  saveFileRef.current = input.saveFile ?? saveJsonFile;
  const stagedDraftsRef = useRef<readonly DraftSnapshot[]>([]);

  useAutoDismiss(exportStatus, setExportStatus);
  useAutoDismiss(importStatus, setImportStatus);

  const runImport = useCallback(
    (drafts: readonly DraftSnapshot[], mode: ImportMode): void => {
      void (async () => {
        try {
          const outcome = await importDrafts.execute(drafts, mode);
          if (outcome.kind === 'storage_unavailable') {
            setImportStatus({ kind: 'import_failed', cause: outcome.cause });
            return;
          }
          setImportStatus({ kind: 'imported', count: outcome.count });
          onImportedRef.current();
        } catch (cause) {
          setImportStatus({ kind: 'import_failed', cause });
        }
      })();
    },
    [importDrafts],
  );

  const triggerExport = useCallback(() => {
    void (async () => {
      try {
        const outcome = await exportAllDrafts.execute();
        if (outcome.kind === 'storage_unavailable') {
          setExportStatus({ kind: 'export_failed', cause: outcome.cause });
          return;
        }
        if (outcome.bundle.drafts.length === 0) {
          setExportStatus({ kind: 'empty' });
          return;
        }
        const json = JSON.stringify(outcome.bundle, null, 2);
        saveFileRef.current(json, buildJsonFilename(clock.now()));
        setExportStatus({ kind: 'exported' });
      } catch (cause) {
        setExportStatus({ kind: 'export_failed', cause });
      }
    })();
  }, [exportAllDrafts, clock]);

  const triggerImport = useCallback(() => {
    void (async () => {
      const file = await openFileRef.current();
      if (file === null) return;
      let parsed: ParsedFile;
      try {
        parsed = await parseImportFile(file);
      } catch (cause) {
        setImportStatus({ kind: 'import_failed', cause });
        return;
      }
      if (!parsed.ok) {
        setImportStatus({ kind: 'invalid_file', message: parsed.message });
        return;
      }
      if (await mayHaveExistingDrafts(countDrafts)) {
        stagedDraftsRef.current = parsed.drafts;
        setPendingImport({ incomingCount: parsed.drafts.length });
        return;
      }
      runImport(parsed.drafts, 'add');
    })();
  }, [countDrafts, runImport]);

  const confirmImport = useCallback(
    (mode: ImportMode) => {
      const drafts = stagedDraftsRef.current;
      stagedDraftsRef.current = [];
      setPendingImport(null);
      runImport(drafts, mode);
    },
    [runImport],
  );

  const cancelImport = useCallback(() => {
    stagedDraftsRef.current = [];
    setPendingImport(null);
  }, []);

  return {
    triggerExport,
    exportStatus,
    triggerImport,
    importStatus,
    pendingImport,
    confirmImport,
    cancelImport,
  };
}

function useAutoDismiss<T>(status: T | null, setStatus: (next: T | null) => void): void {
  useEffect(() => {
    if (status === null) return;
    const handle = setTimeout(() => {
      setStatus(null);
    }, STATUS_DISMISS_MS);
    return () => {
      clearTimeout(handle);
    };
  }, [status, setStatus]);
}
