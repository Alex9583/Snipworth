import { useCallback, useMemo, useState } from 'react';

import type { HighlightLookup } from '@/adapters/primary/app/highlightCache';
import type { DraftSnapshot, DraftStatus } from '@/domain/drafts/Draft';
import { DraftId } from '@/domain/drafts/DraftId';
import type { Platform } from '@/domain/drafts/Platform';

import { DeleteDraftDialog } from './DeleteDraftDialog';
import { DraftCard } from './DraftCard';
import { LibraryCorruptBanner } from './LibraryCorruptBanner';
import { LibraryEmptyState } from './LibraryEmptyState';
import { LibraryFiltersBar } from './LibraryFiltersBar';
import { draftsCountLabel, LIBRARY_VIEW } from './LibraryView.strings';
import type { LibraryDraftsHandle, LibraryFilters } from './useLibraryDrafts';

interface LibraryViewProps {
  readonly library: LibraryDraftsHandle;
  readonly now: Date;
  readonly getHighlight: HighlightLookup;
  readonly onOpenDraft: (id: DraftId) => void;
  readonly onCreateFirstDraft: () => void;
  readonly onReportCorruption: () => void;
  readonly onShowHelp: () => void;
}

export function LibraryView({
  library,
  now,
  getHighlight,
  onOpenDraft,
  onCreateFirstDraft,
  onReportCorruption,
  onShowHelp,
}: LibraryViewProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<DraftId | null>(null);

  const heading =
    library.filters.status === 'archived'
      ? LIBRARY_VIEW.headingArchived
      : LIBRARY_VIEW.headingAllDrafts;

  const languageOptions = useDistinctLanguages(library.drafts);
  const tagOptions = useDistinctHashtags(library.drafts);

  const handleClearFilter = useCallback(
    (key: keyof LibraryFilters) => {
      const { [key]: _, ...rest } = library.filters;
      library.setFilters(rest);
    },
    [library],
  );

  return (
    <div className="flex flex-1 flex-col">
      <LibraryFiltersBar
        filters={library.filters}
        onSearchChange={(search) => {
          library.setFilters({ ...library.filters, search });
        }}
        onPlatformChange={(platform: Platform) => {
          library.setFilters({ ...library.filters, platform });
        }}
        onLanguageChange={(language) => {
          library.setFilters({ ...library.filters, language });
        }}
        languageOptions={languageOptions}
        onTagChange={(tag) => {
          library.setFilters({ ...library.filters, tags: [tag] });
        }}
        tagOptions={tagOptions}
        onNewDraft={onCreateFirstDraft}
        onStatusFilterChange={(status: DraftStatus) => {
          library.setFilters({ ...library.filters, status });
        }}
        onClearFilter={handleClearFilter}
      />

      <div className="flex flex-1 flex-col gap-3 overflow-auto px-6 pt-5 pb-6">
        {library.corrupt.length > 0 && (
          <LibraryCorruptBanner count={library.corrupt.length} onReport={onReportCorruption} />
        )}

        {library.status === 'error' && (
          <p role="alert" className="text-danger text-sm">
            {LIBRARY_VIEW.errorMessage}
          </p>
        )}

        {library.status === 'loading' && (
          <p role="status" className="text-ink-muted text-sm">
            {LIBRARY_VIEW.loadingMessage}
          </p>
        )}

        {library.status === 'loaded' && library.drafts.length === 0 && (
          <LibraryEmptyState onCreateFirstDraft={onCreateFirstDraft} onShowMe={onShowHelp} />
        )}

        {library.status === 'loaded' && library.drafts.length > 0 && (
          <DraftsGrid
            heading={heading}
            drafts={library.drafts}
            now={now}
            getHighlight={getHighlight}
            onOpen={(id) => {
              onOpenDraft(toDraftId(id));
            }}
            onArchive={(id) => {
              void library.archive(toDraftId(id));
            }}
            onRequestDelete={(id) => {
              setPendingDeleteId(toDraftId(id));
            }}
          />
        )}
      </div>

      <DeleteDraftDialog
        open={pendingDeleteId !== null}
        onCancel={() => {
          setPendingDeleteId(null);
        }}
        onConfirm={() => {
          const id = pendingDeleteId;
          setPendingDeleteId(null);
          if (id !== null) void library.delete(id);
        }}
      />
    </div>
  );
}

const failDraftId = (reason: string): never => {
  throw new Error(reason);
};

function toDraftId(raw: string): DraftId {
  return DraftId.from(raw, failDraftId);
}

interface DraftsGridProps {
  readonly heading: string;
  readonly drafts: readonly DraftSnapshot[];
  readonly now: Date;
  readonly getHighlight: HighlightLookup;
  readonly onOpen: (id: string) => void;
  readonly onArchive: (id: string) => void;
  readonly onRequestDelete: (id: string) => void;
}

function DraftsGrid({
  heading,
  drafts,
  now,
  getHighlight,
  onOpen,
  onArchive,
  onRequestDelete,
}: DraftsGridProps) {
  return (
    <>
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2.5">
          <h2 className="text-ink text-[17px] font-semibold">{heading}</h2>
          <span className="text-ink-muted tnum text-xs">{draftsCountLabel(drafts.length)}</span>
        </div>
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {drafts.map((snapshot) => (
          <li key={snapshot.id} className="contents">
            <DraftCard
              snapshot={snapshot}
              now={now}
              getHighlight={getHighlight}
              onOpen={onOpen}
              onArchive={onArchive}
              onDelete={onRequestDelete}
            />
          </li>
        ))}
      </ul>
    </>
  );
}

function useDistinctLanguages(drafts: readonly DraftSnapshot[]): readonly string[] {
  return useMemo(() => Array.from(new Set(drafts.map((d) => d.language))).sort(), [drafts]);
}

function useDistinctHashtags(drafts: readonly DraftSnapshot[]): readonly string[] {
  return useMemo(() => Array.from(new Set(drafts.flatMap((d) => d.hashtags))).sort(), [drafts]);
}
