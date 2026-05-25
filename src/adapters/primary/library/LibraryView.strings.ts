export const LIBRARY_VIEW = {
  headingAllDrafts: 'All drafts',
  headingArchived: 'Archived drafts',
  loadingMessage: 'Loading drafts…',
  errorMessage: 'Could not load your drafts. Please reload the extension.',
  corruptReportButton: 'Report',
  showHelpLinkText: 'Snipworth help',
} as const;

export function draftsCountLabel(count: number): string {
  return count.toString();
}
