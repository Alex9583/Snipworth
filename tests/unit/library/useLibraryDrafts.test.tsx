import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useLibraryDrafts } from '@/adapters/primary/library/useLibraryDrafts';
import { ArchiveDraft } from '@/application/use-cases/ArchiveDraft';
import { DeleteDraft } from '@/application/use-cases/DeleteDraft';
import { ListDrafts } from '@/application/use-cases/ListDrafts';
import { RestoreDraft } from '@/application/use-cases/RestoreDraft';
import type { DraftId } from '@/domain/drafts/DraftId';

import { FakeClock } from '../../setup/fakes/FakeClock';
import { InMemoryDraftRepository } from '../../setup/fakes/InMemoryDraftRepository';
import { anActiveDraft, anArchivedDraft } from '../../setup/mothers/DraftMother';

const ARCHIVED_AT = new Date('2026-05-15T11:00:00Z');

function buildHarness() {
  const repo = new InMemoryDraftRepository();
  const clock = new FakeClock(ARCHIVED_AT);
  return {
    repo,
    listDrafts: new ListDrafts(repo),
    archiveDraft: new ArchiveDraft(repo, clock),
    restoreDraft: new RestoreDraft(repo, clock),
    deleteDraft: new DeleteDraft(repo),
  };
}

describe('useLibraryDrafts', () => {
  it('should_load_active_drafts_sorted_by_recency_when_the_hook_mounts', async () => {
    const { repo, listDrafts, archiveDraft, restoreDraft, deleteDraft } = buildHarness();
    await repo.save(anActiveDraft({ id: 'draft-1' }));

    const { result } = renderHook(() =>
      useLibraryDrafts({ listDrafts, archiveDraft, restoreDraft, deleteDraft }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe('loaded');
    });
    expect(result.current.drafts).toHaveLength(1);
    expect(result.current.drafts[0]?.id).toBe('draft-1');
  });

  it('should_filter_to_archived_drafts_only_when_setFilters_status_is_archived', async () => {
    const { repo, listDrafts, archiveDraft, restoreDraft, deleteDraft } = buildHarness();
    await repo.save(anActiveDraft({ id: 'draft-1' }));
    await repo.save(anArchivedDraft(new Date('2026-05-10T00:00:00Z')));

    const { result } = renderHook(() =>
      useLibraryDrafts({ listDrafts, archiveDraft, restoreDraft, deleteDraft }),
    );
    await waitFor(() => {
      expect(result.current.status).toBe('loaded');
    });

    act(() => {
      result.current.setFilters({ status: 'archived' });
    });
    await waitFor(() => {
      expect(result.current.drafts).toHaveLength(1);
    });

    expect(result.current.drafts[0]?.status).toBe('archived');
  });

  it('should_remove_an_archived_draft_from_the_active_list_after_archive_resolves', async () => {
    const { repo, listDrafts, archiveDraft, restoreDraft, deleteDraft } = buildHarness();
    await repo.save(anActiveDraft({ id: 'draft-1' }));

    const { result } = renderHook(() =>
      useLibraryDrafts({ listDrafts, archiveDraft, restoreDraft, deleteDraft }),
    );
    await waitFor(() => {
      expect(result.current.status).toBe('loaded');
    });

    await act(async () => {
      await result.current.archive('draft-1' as DraftId);
    });

    expect(result.current.drafts).toHaveLength(0);
  });

  it('should_remove_a_deleted_draft_from_the_list_after_delete_resolves', async () => {
    const { repo, listDrafts, archiveDraft, restoreDraft, deleteDraft } = buildHarness();
    await repo.save(anActiveDraft({ id: 'draft-1' }));

    const { result } = renderHook(() =>
      useLibraryDrafts({ listDrafts, archiveDraft, restoreDraft, deleteDraft }),
    );
    await waitFor(() => {
      expect(result.current.status).toBe('loaded');
    });

    await act(async () => {
      await result.current.delete('draft-1' as DraftId);
    });

    expect(result.current.drafts).toHaveLength(0);
  });

  it('should_transition_a_restored_archived_draft_back_into_the_active_list_after_restore_and_filter_switch', async () => {
    const { repo, listDrafts, archiveDraft, restoreDraft, deleteDraft } = buildHarness();
    await repo.save(anArchivedDraft(new Date('2026-05-10T00:00:00Z')));

    const { result } = renderHook(() =>
      useLibraryDrafts({ listDrafts, archiveDraft, restoreDraft, deleteDraft }),
    );
    await waitFor(() => {
      expect(result.current.status).toBe('loaded');
    });

    act(() => {
      result.current.setFilters({ status: 'archived' });
    });
    await waitFor(() => {
      expect(result.current.drafts).toHaveLength(1);
    });

    await act(async () => {
      await result.current.restore('draft-1' as DraftId);
    });
    expect(result.current.drafts).toHaveLength(0);

    act(() => {
      result.current.setFilters({ status: 'draft' });
    });
    await waitFor(() => {
      expect(result.current.drafts).toHaveLength(1);
    });
  });

  it('should_expose_storage_unavailable_status_when_ListDrafts_returns_storage_unavailable', async () => {
    const { repo, listDrafts, archiveDraft, restoreDraft, deleteDraft } = buildHarness();
    repo.enqueueNextFindAllOutcome({
      kind: 'storage_unavailable',
      cause: new Error('quota'),
    });

    const { result } = renderHook(() =>
      useLibraryDrafts({ listDrafts, archiveDraft, restoreDraft, deleteDraft }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current.drafts).toEqual([]);
  });

  it('should_expose_action_error_when_archive_fails_on_nonexistent_draft', async () => {
    const { listDrafts, archiveDraft, restoreDraft, deleteDraft } = buildHarness();

    const { result } = renderHook(() =>
      useLibraryDrafts({ listDrafts, archiveDraft, restoreDraft, deleteDraft }),
    );
    await waitFor(() => {
      expect(result.current.status).toBe('loaded');
    });

    await act(async () => {
      await result.current.archive('nonexistent' as DraftId);
    });

    expect(result.current.actionError).toEqual({
      action: 'archive',
      kind: 'not_found',
    });
  });

  it('should_clear_action_error_when_dismissed', async () => {
    const { listDrafts, archiveDraft, restoreDraft, deleteDraft } = buildHarness();

    const { result } = renderHook(() =>
      useLibraryDrafts({ listDrafts, archiveDraft, restoreDraft, deleteDraft }),
    );
    await waitFor(() => {
      expect(result.current.status).toBe('loaded');
    });

    await act(async () => {
      await result.current.archive('nonexistent' as DraftId);
    });
    expect(result.current.actionError).not.toBeNull();

    act(() => {
      result.current.dismissActionError();
    });

    expect(result.current.actionError).toBeNull();
  });

  it('should_clear_previous_action_error_when_a_new_action_starts', async () => {
    const { repo, listDrafts, archiveDraft, restoreDraft, deleteDraft } = buildHarness();
    await repo.save(anActiveDraft({ id: 'draft-1' }));

    const { result } = renderHook(() =>
      useLibraryDrafts({ listDrafts, archiveDraft, restoreDraft, deleteDraft }),
    );
    await waitFor(() => {
      expect(result.current.status).toBe('loaded');
    });

    await act(async () => {
      await result.current.archive('nonexistent' as DraftId);
    });
    expect(result.current.actionError).not.toBeNull();

    await act(async () => {
      await result.current.delete('draft-1' as DraftId);
    });

    expect(result.current.actionError).toBeNull();
  });
});
