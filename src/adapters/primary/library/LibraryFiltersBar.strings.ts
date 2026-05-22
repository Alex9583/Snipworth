import type { DraftStatus } from '@/domain/drafts/Draft';
import type { Platform } from '@/domain/drafts/Platform';

const PLATFORM_OPTIONS: Readonly<Record<Platform, string>> = {
  'x': 'X',
  'linkedin': 'LinkedIn',
  'instagram': 'Instagram',
  'instagram-story': 'Story',
  'thread': 'Thread',
  'generic': 'Free',
};

const STATUS_OPTIONS: Readonly<Record<DraftStatus, string>> = {
  draft: 'Draft',
  archived: 'Archived',
};

export const LIBRARY_FILTERS_BAR = {
  searchLabel: 'Search drafts',
  searchPlaceholder: 'Search drafts…',
  platformLabel: 'Platform',
  platformOptions: PLATFORM_OPTIONS,
  languageLabel: 'Language',
  tagsLabel: 'Tags',
  newDraftButton: 'New draft',
  statusLabel: 'Status',
  statusOptions: STATUS_OPTIONS,
  exportAllButton: 'Export all (ZIP)',
} as const;
