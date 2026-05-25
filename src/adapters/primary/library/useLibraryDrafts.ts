import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ArchiveDraft } from '@/application/use-cases/ArchiveDraft';
import type { DeleteDraft } from '@/application/use-cases/DeleteDraft';
import type { ListDrafts, ListDraftsFilters } from '@/application/use-cases/ListDrafts';
import type { RestoreDraft } from '@/application/use-cases/RestoreDraft';
import type { CorruptDraftRow } from '@/application/ports/DraftRepository';
import type { DraftSnapshot } from '@/domain/drafts/Draft';
import type { DraftId } from '@/domain/drafts/DraftId';

export type LibraryFilters = ListDraftsFilters;
export type LibraryStatus = 'loading' | 'loaded' | 'error';

export interface LibraryActionError {
  readonly action: 'archive' | 'restore' | 'delete';
  readonly kind: 'not_found' | 'corrupt' | 'storage_unavailable';
}

type ListDraftsPort = Pick<ListDrafts, 'execute'>;
type ArchiveDraftPort = Pick<ArchiveDraft, 'execute'>;
type RestoreDraftPort = Pick<RestoreDraft, 'execute'>;
type DeleteDraftPort = Pick<DeleteDraft, 'execute'>;

export interface UseLibraryDraftsInput {
  readonly listDrafts: ListDraftsPort;
  readonly archiveDraft: ArchiveDraftPort;
  readonly restoreDraft: RestoreDraftPort;
  readonly deleteDraft: DeleteDraftPort;
  readonly initialFilters?: LibraryFilters;
}

export interface LibraryDraftsHandle {
  readonly status: LibraryStatus;
  readonly drafts: readonly DraftSnapshot[];
  readonly corrupt: readonly CorruptDraftRow[];
  readonly filters: LibraryFilters;
  readonly setFilters: (next: LibraryFilters) => void;
  readonly archive: (id: DraftId) => Promise<void>;
  readonly restore: (id: DraftId) => Promise<void>;
  readonly delete: (id: DraftId) => Promise<void>;
  readonly refresh: () => Promise<void>;
  readonly actionError: LibraryActionError | null;
  readonly dismissActionError: () => void;
}

export function useLibraryDrafts(input: UseLibraryDraftsInput): LibraryDraftsHandle {
  const { listDrafts, archiveDraft, restoreDraft, deleteDraft } = input;
  const [filters, setFilters] = useState<LibraryFilters>(input.initialFilters ?? {});
  const [status, setStatus] = useState<LibraryStatus>('loading');
  const [drafts, setDrafts] = useState<readonly DraftSnapshot[]>([]);
  const [corrupt, setCorrupt] = useState<readonly CorruptDraftRow[]>([]);
  const [actionError, setActionError] = useState<LibraryActionError | null>(null);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const refresh = useCallback(async (): Promise<void> => {
    const outcome = await listDrafts.execute({ filters: filtersRef.current });
    if (outcome.kind === 'loaded') {
      setDrafts(outcome.snapshots);
      setCorrupt(outcome.corrupt);
      setStatus('loaded');
    } else {
      setDrafts([]);
      setCorrupt([]);
      setStatus('error');
    }
  }, [listDrafts]);

  useEffect(() => {
    void refresh();
  }, [refresh, filters]);

  const dismissActionError = useCallback(() => {
    setActionError(null);
  }, []);

  const archive = useCallback(
    async (id: DraftId): Promise<void> => {
      setActionError(null);
      const outcome = await archiveDraft.execute({ id });
      if (outcome.kind === 'archived') {
        await refresh();
      } else {
        setActionError({ action: 'archive', kind: outcome.kind });
      }
    },
    [archiveDraft, refresh],
  );

  const restore = useCallback(
    async (id: DraftId): Promise<void> => {
      setActionError(null);
      const outcome = await restoreDraft.execute({ id });
      if (outcome.kind === 'restored') {
        await refresh();
      } else {
        setActionError({ action: 'restore', kind: outcome.kind });
      }
    },
    [restoreDraft, refresh],
  );

  const remove = useCallback(
    async (id: DraftId): Promise<void> => {
      setActionError(null);
      const outcome = await deleteDraft.execute({ id });
      if (outcome.kind === 'deleted') {
        await refresh();
      } else {
        setActionError({ action: 'delete', kind: outcome.kind });
      }
    },
    [deleteDraft, refresh],
  );

  return useMemo(
    () => ({
      status,
      drafts,
      corrupt,
      filters,
      setFilters,
      archive,
      restore,
      delete: remove,
      refresh,
      actionError,
      dismissActionError,
    }),
    [
      status,
      drafts,
      corrupt,
      filters,
      archive,
      restore,
      remove,
      refresh,
      actionError,
      dismissActionError,
    ],
  );
}
