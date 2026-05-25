import type { DraftStatus } from '@/domain/drafts/Draft';

const STATUS_OPTIONS: Readonly<Record<DraftStatus, string>> = {
  draft: 'Draft',
  archived: 'Archived',
};

export const LIBRARY_FILTERS_BAR = {
  searchLabel: 'Search drafts',
  searchPlaceholder: 'Search drafts…',
  platformLabel: 'Platform',
  languageLabel: 'Language',
  tagsLabel: 'Tags',
  newDraftButton: 'New draft',
  statusLabel: 'Status',
  statusOptions: STATUS_OPTIONS,
  exportAllButton: 'Export all (ZIP)',
  exportAllTooltip: 'Coming soon',
  clearFilterLabel: (filterName: string) => `Clear ${filterName} filter`,
} as const;
