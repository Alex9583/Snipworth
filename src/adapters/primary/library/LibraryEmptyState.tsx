import { Button } from '@/adapters/primary/app/ui/Button';
import { HelpCircleIcon, PlusIcon } from '@/adapters/primary/app/ui/icons';

import { LIBRARY_EMPTY_STATE } from './LibraryEmptyState.strings';

interface LibraryEmptyStateProps {
  readonly onCreateFirstDraft: () => void;
  readonly onShowMe: () => void;
}

export function LibraryEmptyState({ onCreateFirstDraft, onShowMe }: LibraryEmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-10">
      <div className="max-w-95 text-center">
        <EmptyStateIllustration />
        <h2 className="text-ink mb-2 text-xl font-semibold">{LIBRARY_EMPTY_STATE.headline}</h2>
        <p className="text-ink-muted mb-5.5 text-sm leading-relaxed">{LIBRARY_EMPTY_STATE.body}</p>
        <div className="flex justify-center gap-2.5">
          <Button iconLeft={<PlusIcon size={14} />} onClick={onCreateFirstDraft}>
            {LIBRARY_EMPTY_STATE.primaryCta}
          </Button>
          <Button variant="outline" iconLeft={<HelpCircleIcon size={14} />} onClick={onShowMe}>
            {LIBRARY_EMPTY_STATE.secondaryCta}
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmptyStateIllustration() {
  return (
    <div aria-hidden="true" className="relative mx-auto mb-6 h-27.5 w-35">
      <div className="bg-elevated border-line absolute top-5.5 left-4 h-17 w-24 rotate-[-8deg] rounded-lg border" />
      <div className="bg-surface border-line-strong absolute top-3.5 left-8 h-17 w-24 rotate-[4deg] rounded-lg border" />
      <div className="bg-elevated border-line-strong absolute top-6.5 left-6 h-17 w-24 rounded-lg border">
        <div className="flex gap-0.75 p-2">
          <span className="bg-traffic-light-close size-1.25 rounded-full" />
          <span className="bg-traffic-light-minimize size-1.25 rounded-full" />
          <span className="bg-traffic-light-maximize size-1.25 rounded-full" />
        </div>
        <div className="text-ink-muted px-2.5 font-mono text-[8px] leading-normal">
          <div>function…</div>
          <div>&nbsp;&nbsp;return…</div>
          <div>{'}'}</div>
        </div>
      </div>
      <div className="bg-accent absolute -right-1 -bottom-1 flex size-9 items-center justify-center rounded-full text-white shadow-lg">
        <PlusIcon size={18} strokeWidth={2.5} />
      </div>
    </div>
  );
}
