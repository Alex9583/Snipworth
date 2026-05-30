export const IMPORT_MODE_DIALOG = {
  title: 'Import drafts',
  body: (incomingCount: number) =>
    `This file contains ${String(incomingCount)} ${incomingCount === 1 ? 'draft' : 'drafts'}. ` +
    `Add them to your library, or replace your whole library with this file?`,
  replaceWarning: 'Replacing permanently deletes the drafts you have now.',
  cancelButton: 'Cancel',
  addButton: 'Add to library',
  replaceButton: 'Replace library',
} as const;
