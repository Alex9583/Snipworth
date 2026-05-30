export const EXPORT_IMPORT_STATUS = {
  exported: 'Library exported',
  exportEmpty: 'Nothing to export — your library is empty',
  exportFailed: 'Export failed — please try again',
  imported: (count: number) => `Imported ${String(count)} ${count === 1 ? 'draft' : 'drafts'}`,
  invalidFile: "That file isn't a valid Snipworth export",
  importFailed: 'Import failed — please try again',
} as const;
