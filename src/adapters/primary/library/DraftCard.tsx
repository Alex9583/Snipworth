import { useEffect, useRef, useState } from 'react';

import type { HighlightLookup } from '@/adapters/primary/app/highlightCache';
import { HighlightedPreview } from '@/adapters/primary/app/HighlightedPreview';
import { Badge } from '@/adapters/primary/app/ui/Badge';
import type { DraftSnapshot, DraftStatus } from '@/domain/drafts/Draft';

import { DRAFT_CARD } from './DraftCard.strings';
import type { IntersectionObserverFactory } from './IntersectionObserverFactory';
import { relativeTimeLabel } from './relativeTime';

const LAZY_PREVIEW_ROOT_MARGIN = '200px';

const defaultObserverFactory: IntersectionObserverFactory = (cb, opts) =>
  new IntersectionObserver(cb, opts);

interface DraftCardProps {
  readonly snapshot: DraftSnapshot;
  readonly now: Date;
  readonly onOpen: (id: string) => void;
  readonly onArchive?: (id: string) => void;
  readonly onRestore?: (id: string) => void;
  readonly onDelete?: (id: string) => void;
  readonly getHighlight?: HighlightLookup;
  readonly observerFactory?: IntersectionObserverFactory;
}

export function DraftCard({
  snapshot,
  now,
  onOpen,
  onArchive,
  onRestore,
  onDelete,
  getHighlight,
  observerFactory,
}: DraftCardProps) {
  return (
    <article
      data-status={snapshot.status}
      className="border-line bg-surface relative flex flex-col overflow-hidden rounded-lg border shadow-sm"
    >
      <button
        type="button"
        aria-label={snapshot.title}
        onClick={() => {
          onOpen(snapshot.id);
        }}
        className="focus-visible:ring-accent flex w-full flex-col text-left focus-visible:ring-2 focus-visible:outline-none"
      >
        {getHighlight !== undefined ? (
          <DraftPreview
            getHighlight={getHighlight}
            code={snapshot.code}
            language={snapshot.language}
            theme={snapshot.config.theme}
            observerFactory={observerFactory}
          />
        ) : null}
        <DraftSummary
          title={snapshot.title}
          language={snapshot.language}
          platform={snapshot.platform}
          updatedAt={snapshot.updatedAt}
          now={now}
        />
      </button>
      <DraftActionsMenu
        draftId={snapshot.id}
        status={snapshot.status}
        onArchive={onArchive}
        onRestore={onRestore}
        onDelete={onDelete}
      />
    </article>
  );
}

interface DraftPreviewProps {
  readonly getHighlight: HighlightLookup;
  readonly code: string;
  readonly language: string;
  readonly theme: string;
  readonly observerFactory?: IntersectionObserverFactory;
}

function DraftPreview({ getHighlight, code, language, theme, observerFactory }: DraftPreviewProps) {
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (element === null) return;
    const factory = observerFactory ?? defaultObserverFactory;
    const observer = factory(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setHasBeenVisible(true);
            return;
          }
        }
      },
      { rootMargin: LAZY_PREVIEW_ROOT_MARGIN },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [observerFactory]);

  return (
    <div
      ref={containerRef}
      className="border-line bg-preview-canvas aspect-video w-full overflow-hidden border-b"
    >
      {hasBeenVisible ? (
        <HighlightedPreview
          getHighlight={getHighlight}
          code={code}
          language={language}
          theme={theme}
          fontSize={10}
          compact
        />
      ) : (
        <div
          aria-hidden="true"
          data-testid="draft-card-preview-placeholder"
          className="h-full w-full"
        />
      )}
    </div>
  );
}

interface DraftSummaryProps {
  readonly title: string;
  readonly language: string;
  readonly platform: string;
  readonly updatedAt: number;
  readonly now: Date;
}

function DraftSummary({ title, language, platform, updatedAt, now }: DraftSummaryProps) {
  const updatedLabel = `${DRAFT_CARD.updatedPrefix}${relativeTimeLabel(new Date(updatedAt), now)}`;
  return (
    <div className="flex flex-col gap-2 px-3.5 pt-3.5 pb-3.5">
      <h3 className="truncate text-[13.5px] font-semibold">{title}</h3>
      <div className="flex gap-1.5">
        <Badge>{language}</Badge>
        <Badge>{platform}</Badge>
      </div>
      <span className="text-ink-muted mt-0.5 text-[11.5px]">{updatedLabel}</span>
    </div>
  );
}

interface DraftActionsMenuProps {
  readonly draftId: string;
  readonly status: DraftStatus;
  readonly onArchive?: (id: string) => void;
  readonly onRestore?: (id: string) => void;
  readonly onDelete?: (id: string) => void;
}

function DraftActionsMenu({
  draftId,
  status,
  onArchive,
  onRestore,
  onDelete,
}: DraftActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const isArchived = status === 'archived';
  return (
    <>
      <button
        type="button"
        aria-label={DRAFT_CARD.menuButtonLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((prev) => !prev);
        }}
        className="text-ink-muted hover:bg-elevated hover:text-ink focus-visible:ring-accent absolute right-3 bottom-3 inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <span aria-hidden="true">⋮</span>
      </button>
      {open ? (
        <ul
          role="menu"
          aria-label={DRAFT_CARD.menuButtonLabel}
          className="border-line bg-surface absolute right-3 bottom-12 z-10 flex min-w-35 flex-col rounded-md border py-1 shadow-md"
        >
          <li role="none">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                if (isArchived) {
                  onRestore?.(draftId);
                } else {
                  onArchive?.(draftId);
                }
              }}
              className="text-ink hover:bg-elevated w-full px-3 py-1.5 text-left text-[12.5px]"
            >
              {isArchived ? DRAFT_CARD.restoreLabel : DRAFT_CARD.archiveLabel}
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onDelete?.(draftId);
              }}
              className="text-ink hover:bg-elevated w-full px-3 py-1.5 text-left text-[12.5px]"
            >
              {DRAFT_CARD.deleteLabel}
            </button>
          </li>
        </ul>
      ) : null}
    </>
  );
}
