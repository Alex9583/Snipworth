import { clsx } from 'clsx';

import { EXPORT_IMPORT_STATUS } from './ExportImportStatus.strings';
import type { ExportOutcome, ImportOutcome } from './useExportImport';

interface ExportImportStatusProps {
  readonly exportStatus: ExportOutcome | null;
  readonly importStatus: ImportOutcome | null;
}

interface StatusEntry {
  readonly message: string;
  readonly severity: 'info' | 'error';
}

function fromImport(status: ImportOutcome): StatusEntry {
  switch (status.kind) {
    case 'imported':
      return { message: EXPORT_IMPORT_STATUS.imported(status.count), severity: 'info' };
    case 'invalid_file':
      return { message: EXPORT_IMPORT_STATUS.invalidFile, severity: 'error' };
    case 'import_failed':
      return { message: EXPORT_IMPORT_STATUS.importFailed, severity: 'error' };
  }
}

function fromExport(status: ExportOutcome): StatusEntry {
  switch (status.kind) {
    case 'exported':
      return { message: EXPORT_IMPORT_STATUS.exported, severity: 'info' };
    case 'empty':
      return { message: EXPORT_IMPORT_STATUS.exportEmpty, severity: 'info' };
    case 'export_failed':
      return { message: EXPORT_IMPORT_STATUS.exportFailed, severity: 'error' };
  }
}

export function ExportImportStatus({ exportStatus, importStatus }: ExportImportStatusProps) {
  const entry = importStatus
    ? fromImport(importStatus)
    : exportStatus
      ? fromExport(exportStatus)
      : null;

  if (entry === null) return null;

  return (
    <div
      role={entry.severity === 'error' ? 'alert' : 'status'}
      className={clsx(
        'border-line bg-elevated fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-md border px-3.5 py-2.5 text-sm shadow-md',
        entry.severity === 'error' ? 'text-danger' : 'text-ink',
      )}
    >
      {entry.message}
    </div>
  );
}
