import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { HighlightLookup } from '@/adapters/primary/app/highlightCache';
import { LibraryView } from '@/adapters/primary/library/LibraryView';
import type { LibraryDraftsHandle } from '@/adapters/primary/library/useLibraryDrafts';
import type { DraftSnapshot } from '@/domain/drafts/Draft';
import type { DraftId } from '@/domain/drafts/DraftId';
import { RenderConfig } from '@/domain/rendering/RenderConfig';

function emptyHighlight(): HighlightLookup {
  return (() => null) as unknown as HighlightLookup;
}

function aDraftSnapshot(overrides: Partial<DraftSnapshot> = {}): DraftSnapshot {
  return {
    id: 'draft-1',
    title: 'Memoize React renders',
    code: 'const x = 1;',
    language: 'typescript',
    config: RenderConfig.default().toSnapshot(),
    caption: '',
    hashtags: [],
    platform: 'x',
    status: 'draft',
    createdAt: 1_000,
    updatedAt: 2_000,
    ...overrides,
  };
}

function buildHandle(overrides: Partial<LibraryDraftsHandle> = {}): LibraryDraftsHandle {
  return {
    status: 'loaded',
    drafts: [],
    corrupt: [],
    filters: {},
    setFilters: vi.fn(),
    archive: vi.fn().mockResolvedValue(undefined),
    restore: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn().mockResolvedValue(undefined),
    actionError: null,
    dismissActionError: vi.fn(),
    ...overrides,
  };
}

describe('LibraryView', () => {
  const NOW = new Date('2026-05-15T12:00:00Z');

  function renderView(overrides: Partial<LibraryDraftsHandle> = {}) {
    const library = buildHandle(overrides);
    const onOpenDraft = vi.fn();
    const onCreateFirstDraft = vi.fn();
    const onReportCorruption = vi.fn();
    const onShowHelp = vi.fn();
    const onExportAll = vi.fn();
    const onImport = vi.fn();
    render(
      <LibraryView
        library={library}
        now={NOW}
        getHighlight={emptyHighlight()}
        onOpenDraft={onOpenDraft}
        onCreateFirstDraft={onCreateFirstDraft}
        onReportCorruption={onReportCorruption}
        onShowHelp={onShowHelp}
        onExportAll={onExportAll}
        onImport={onImport}
      />,
    );
    return {
      library,
      onOpenDraft,
      onCreateFirstDraft,
      onReportCorruption,
      onShowHelp,
      onExportAll,
      onImport,
    };
  }

  it('should_render_the_empty_state_when_status_is_loaded_and_no_drafts_are_present', () => {
    renderView({ status: 'loaded', drafts: [] });

    expect(screen.getByRole('heading', { name: /no drafts yet/i })).toBeInTheDocument();
  });

  it('should_render_a_draft_card_per_loaded_draft_when_drafts_are_present', () => {
    renderView({
      status: 'loaded',
      drafts: [
        aDraftSnapshot({ id: 'd1', title: 'First' }),
        aDraftSnapshot({ id: 'd2', title: 'Second' }),
      ],
    });

    expect(screen.getByRole('button', { name: 'First' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Second' })).toBeInTheDocument();
  });

  it('should_render_a_loading_status_when_library_status_is_loading', () => {
    renderView({ status: 'loading' });

    expect(screen.getByRole('status')).toHaveTextContent(/loading drafts/i);
  });

  it('should_render_an_alert_when_library_status_is_error', () => {
    renderView({ status: 'error' });

    expect(screen.getByRole('alert')).toHaveTextContent(/could not load/i);
  });

  it('should_call_library_delete_with_the_draft_id_after_the_user_confirms_the_delete_dialog', async () => {
    const user = userEvent.setup();
    const { library } = renderView({
      status: 'loaded',
      drafts: [aDraftSnapshot({ id: 'doomed' })],
    });

    await user.click(screen.getByRole('button', { name: /^more$/i }));
    await user.click(screen.getByRole('menuitem', { name: /delete/i }));
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(library.delete).toHaveBeenCalledWith('doomed' as DraftId);
  });

  it('should_call_onOpenDraft_when_user_clicks_the_card', async () => {
    const user = userEvent.setup();
    const { onOpenDraft } = renderView({
      status: 'loaded',
      drafts: [aDraftSnapshot({ id: 'open-me', title: 'Open me' })],
    });

    await user.click(screen.getByRole('button', { name: 'Open me' }));

    expect(onOpenDraft).toHaveBeenCalledWith('open-me' as DraftId);
  });
});
