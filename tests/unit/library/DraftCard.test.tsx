import { Suspense, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Root } from 'hast';

import { createHighlightCache } from '@/adapters/primary/app/highlightCache';
import { DraftCard } from '@/adapters/primary/library/DraftCard';
import { DRAFT_CARD } from '@/adapters/primary/library/DraftCard.strings';
import type { DraftSnapshot } from '@/domain/drafts/Draft';

import { FakeIntersectionObserverFactory } from '../../setup/fakes/FakeIntersectionObserverFactory';
import { FakeSyntaxHighlighter } from '../../setup/fakes/FakeSyntaxHighlighter';
import { anActiveDraft } from '../../setup/mothers/DraftMother';

const NOW = new Date('2026-05-17T10:00:00Z');
const TWO_DAYS_BEFORE_NOW = new Date('2026-05-15T10:00:00Z');
const PREVIEW_FALLBACK = 'Loading preview…';

function aHastWithText(text: string): Root {
  return {
    type: 'root',
    children: [
      {
        type: 'element',
        tagName: 'pre',
        properties: {},
        children: [
          {
            type: 'element',
            tagName: 'code',
            properties: {},
            children: [{ type: 'text', value: text }],
          },
        ],
      },
    ],
  };
}

function aHighlightCache(text: string) {
  const highlighter = new FakeSyntaxHighlighter();
  highlighter.setNextResult({
    hast: aHastWithText(text),
    resolvedLanguage: 'typescript',
    resolvedTheme: 'github-dark',
  });
  return createHighlightCache(highlighter);
}

async function renderAndFlush(ui: ReactElement): Promise<ReturnType<typeof render>> {
  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(ui);
    await Promise.resolve();
  });
  return result;
}

function aSnapshotWith(overrides: Partial<DraftSnapshot> = {}): DraftSnapshot {
  return {
    ...anActiveDraft({ id: 'draft-1' }).toSnapshot(),
    title: 'Hello',
    language: 'typescript',
    platform: 'x',
    updatedAt: TWO_DAYS_BEFORE_NOW.getTime(),
    ...overrides,
  };
}

describe('DraftCard', () => {
  it('should_render_title_language_platform_and_relative_date_when_a_draft_snapshot_is_provided', () => {
    render(<DraftCard snapshot={aSnapshotWith()} now={NOW} onOpen={vi.fn()} />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('typescript')).toBeInTheDocument();
    expect(screen.getByText('x')).toBeInTheDocument();
    expect(screen.getByText(/Updated 2 days ago/)).toBeInTheDocument();
  });

  it('should_invoke_onOpen_with_the_draft_id_when_the_card_body_is_clicked', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<DraftCard snapshot={aSnapshotWith({ title: 'Hello' })} now={NOW} onOpen={onOpen} />);

    await user.click(screen.getByRole('button', { name: 'Hello' }));

    expect(onOpen).toHaveBeenCalledExactlyOnceWith('draft-1');
  });

  it('should_invoke_onArchive_and_not_onOpen_when_user_opens_the_dropdown_and_clicks_Archive', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onArchive = vi.fn();
    render(
      <DraftCard snapshot={aSnapshotWith()} now={NOW} onOpen={onOpen} onArchive={onArchive} />,
    );

    await user.click(screen.getByRole('button', { name: DRAFT_CARD.menuButtonLabel }));
    await user.click(screen.getByRole('menuitem', { name: DRAFT_CARD.archiveLabel }));

    expect(onArchive).toHaveBeenCalledExactlyOnceWith('draft-1');
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('should_invoke_onDelete_and_not_onOpen_when_user_opens_the_dropdown_and_clicks_Delete', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onDelete = vi.fn();
    render(<DraftCard snapshot={aSnapshotWith()} now={NOW} onOpen={onOpen} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: DRAFT_CARD.menuButtonLabel }));
    await user.click(screen.getByRole('menuitem', { name: DRAFT_CARD.deleteLabel }));

    expect(onDelete).toHaveBeenCalledExactlyOnceWith('draft-1');
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('should_carry_a_data_status_archived_attribute_when_snapshot_status_is_archived', () => {
    const snapshot = aSnapshotWith({ status: 'archived' });

    const { container } = render(<DraftCard snapshot={snapshot} now={NOW} onOpen={vi.fn()} />);

    expect(container.querySelector('article')).toHaveAttribute('data-status', 'archived');
  });

  it('should_render_a_placeholder_and_not_the_highlighted_preview_when_the_card_is_off_screen', () => {
    const getHighlight = aHighlightCache('const x = 1;');
    const observer = new FakeIntersectionObserverFactory();

    render(
      <Suspense fallback={<p>{PREVIEW_FALLBACK}</p>}>
        <DraftCard
          snapshot={aSnapshotWith({ code: 'const x = 1;' })}
          now={NOW}
          onOpen={vi.fn()}
          getHighlight={getHighlight}
          observerFactory={observer.factory}
        />
      </Suspense>,
    );

    expect(screen.getByTestId('draft-card-preview-placeholder')).toBeInTheDocument();
    expect(screen.queryByText('const x = 1;')).not.toBeInTheDocument();
    expect(screen.queryByText(PREVIEW_FALLBACK)).not.toBeInTheDocument();
  });

  it('should_mount_the_HighlightedPreview_when_the_observer_reports_the_card_as_visible', async () => {
    const getHighlight = aHighlightCache('const x = 1;');
    const observer = new FakeIntersectionObserverFactory();

    await renderAndFlush(
      <Suspense fallback={<p>{PREVIEW_FALLBACK}</p>}>
        <DraftCard
          snapshot={aSnapshotWith({ code: 'const x = 1;' })}
          now={NOW}
          onOpen={vi.fn()}
          getHighlight={getHighlight}
          observerFactory={observer.factory}
        />
      </Suspense>,
    );

    await act(async () => {
      observer.triggerIntersection(true);
      await Promise.resolve();
    });

    expect(screen.getByText('const x = 1;')).toBeInTheDocument();
  });

  it('should_keep_the_HighlightedPreview_mounted_after_the_observer_reports_off_screen_again', async () => {
    const getHighlight = aHighlightCache('const x = 1;');
    const observer = new FakeIntersectionObserverFactory();

    await renderAndFlush(
      <Suspense fallback={<p>{PREVIEW_FALLBACK}</p>}>
        <DraftCard
          snapshot={aSnapshotWith({ code: 'const x = 1;' })}
          now={NOW}
          onOpen={vi.fn()}
          getHighlight={getHighlight}
          observerFactory={observer.factory}
        />
      </Suspense>,
    );
    await act(async () => {
      observer.triggerIntersection(true);
      await Promise.resolve();
    });

    await act(async () => {
      observer.triggerIntersection(false);
      await Promise.resolve();
    });

    expect(screen.getByText('const x = 1;')).toBeInTheDocument();
    expect(screen.queryByTestId('draft-card-preview-placeholder')).not.toBeInTheDocument();
  });
});
