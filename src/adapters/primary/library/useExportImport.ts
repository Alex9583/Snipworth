import { useCallback, useEffect, useRef, useState } from 'react';

import type { Clock } from '@/application/ports/Clock';
import type { ExportAllDrafts } from '@/application/use-cases/ExportAllDrafts';
import type { ImportDrafts } from '@/application/use-cases/ImportDrafts';

import { exportBundleSchema } from './exportBundleSchema';

const STATUS_DISMISS_MS = 5000;
const JSON_MIME = 'application/json';

export type ExportOutcome =
  | { readonly kind: 'exported' }
  | { readonly kind: 'empty' }
  | { readonly kind: 'export_failed'; readonly cause: unknown };

export type ImportOutcome =
  | { readonly kind: 'imported'; readonly count: number }
  | { readonly kind: 'invalid_file'; readonly message: string }
  | { readonly kind: 'import_failed'; readonly cause: unknown };

export interface UseExportImportInput {
  readonly exportAllDrafts: Pick<ExportAllDrafts, 'execute'>;
  readonly importDrafts: Pick<ImportDrafts, 'execute'>;
  readonly clock: Pick<Clock, 'now'>;
  readonly onImported: () => void;
}

export interface ExportImportHandle {
  readonly triggerExport: () => void;
  readonly exportStatus: ExportOutcome | null;
  readonly triggerImport: () => void;
  readonly importStatus: ImportOutcome | null;
}

function buildJsonFilename(at: Date): string {
  const iso = at.toISOString().slice(0, 19).replace(/[T:]/g, '-');
  return `snipworth-export-${iso}.json`;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function useExportImport(input: UseExportImportInput): ExportImportHandle {
  const { exportAllDrafts, importDrafts, clock, onImported } = input;

  const [exportStatus, setExportStatus] = useState<ExportOutcome | null>(null);
  const [importStatus, setImportStatus] = useState<ImportOutcome | null>(null);

  const onImportedRef = useRef(onImported);
  useEffect(() => {
    onImportedRef.current = onImported;
  }, [onImported]);

  useAutoDismiss(exportStatus, setExportStatus);
  useAutoDismiss(importStatus, setImportStatus);

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
        const blob = new Blob([json], { type: JSON_MIME });
        downloadBlob(blob, buildJsonFilename(clock.now()));
        setExportStatus({ kind: 'exported' });
      } catch (cause) {
        setExportStatus({ kind: 'export_failed', cause });
      }
    })();
  }, [exportAllDrafts, clock]);

  const triggerImport = useCallback(() => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (file === undefined) return;
      void handleImportFile(file, importDrafts, setImportStatus, onImportedRef);
    });
    fileInput.click();
  }, [importDrafts]);

  return { triggerExport, exportStatus, triggerImport, importStatus };
}

async function handleImportFile(
  file: File,
  importDrafts: Pick<ImportDrafts, 'execute'>,
  setStatus: (status: ImportOutcome) => void,
  onImportedRef: React.RefObject<() => void>,
): Promise<void> {
  try {
    const text = await file.text();
    const raw: unknown = JSON.parse(text);
    const parsed = exportBundleSchema.safeParse(raw);
    if (!parsed.success) {
      setStatus({ kind: 'invalid_file', message: parsed.error.message });
      return;
    }

    const outcome = await importDrafts.execute(parsed.data.drafts);
    if (outcome.kind === 'storage_unavailable') {
      setStatus({ kind: 'import_failed', cause: outcome.cause });
      return;
    }

    setStatus({ kind: 'imported', count: outcome.count });
    onImportedRef.current();
  } catch (cause) {
    setStatus({ kind: 'import_failed', cause });
  }
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
