import { useEffect, useEffectEvent, useId } from 'react';

import { Button } from '@/adapters/primary/app/ui/Button';
import { HashIcon, TypeIcon } from '@/adapters/primary/app/ui/icons';
import { Input } from '@/adapters/primary/app/ui/Input';
import { platformCharLimit } from '@/domain/drafts/platformCharLimit';
import type { Platform } from '@/domain/drafts/Platform';

import { CAPTION_BAR, remainingHint } from './CaptionBar.strings';
import { CAPTION_DIALOG } from './CaptionDialog.strings';
import { characterCounterState } from './characterCounterState';
import { platformDisplayLabel } from '@/adapters/primary/shared/platformLabels';
import { splitHashtags } from './splitHashtags';

interface CaptionDialogProps {
  readonly open: boolean;
  readonly caption: string;
  readonly hashtagsRaw: string;
  readonly platform: Platform;
  readonly onCaptionChange: (caption: string) => void;
  readonly onHashtagsRawChange: (raw: string) => void;
  readonly onClose: () => void;
}

export function CaptionDialog({
  open,
  caption,
  hashtagsRaw,
  platform,
  onCaptionChange,
  onHashtagsRawChange,
  onClose,
}: CaptionDialogProps) {
  const titleId = useId();

  const handleEscape = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  });

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  if (!open) return null;

  const hashtags = splitHashtags(hashtagsRaw);
  const used = caption.length + hashtags.join(' ').length;
  const limit = platformCharLimit(platform);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="border-line bg-surface relative z-10 flex w-full max-w-2xl flex-col gap-5 rounded-lg border p-6 shadow-xl"
      >
        <h2 id={titleId} className="text-ink text-base font-semibold">
          {CAPTION_DIALOG.title}
        </h2>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="caption-dialog-caption"
            className="text-ink-muted flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide"
          >
            <TypeIcon size={11} />
            {CAPTION_DIALOG.captionLabel}
          </label>
          <textarea
            id="caption-dialog-caption"
            aria-label={CAPTION_DIALOG.captionLabel}
            value={caption}
            onChange={(event) => {
              onCaptionChange(event.target.value);
            }}
            rows={6}
            className="border-line bg-elevated text-ink placeholder:text-ink-muted focus-visible:ring-accent w-full resize-y rounded-md border px-3 py-2.5 text-sm leading-relaxed focus-visible:ring-2 focus-visible:outline-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="caption-dialog-hashtags"
            className="text-ink-muted flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide"
          >
            <HashIcon size={11} />
            {CAPTION_DIALOG.hashtagsLabel}
          </label>
          <Input
            id="caption-dialog-hashtags"
            aria-label={CAPTION_DIALOG.hashtagsLabel}
            icon={<HashIcon size={13} />}
            value={hashtagsRaw}
            onChange={(event) => {
              onHashtagsRawChange(event.target.value);
            }}
          />
        </div>

        <DialogCharacterCounter used={used} limit={limit} platform={platform} />

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            {CAPTION_DIALOG.closeButton}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface DialogCharacterCounterProps {
  readonly used: number;
  readonly limit: number | null;
  readonly platform: Platform;
}

function DialogCharacterCounter({ used, limit, platform }: DialogCharacterCounterProps) {
  if (limit === null) return null;
  const state = characterCounterState(used, limit);
  const fillPercent = Math.min(100, (used / limit) * 100);
  const platformLabel = platformDisplayLabel(platform);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-ink-muted text-[11px] font-medium uppercase tracking-wide">
          {CAPTION_BAR.charactersLabel}
        </span>
        <span
          data-state={state}
          className="tnum text-ink-muted text-xs data-[state=warning]:text-amber-500 data-[state=error]:text-red-500"
        >
          {String(used)} / {String(limit)}
        </span>
      </div>
      <div className="border-line bg-elevated h-1.5 overflow-hidden rounded-sm border">
        <div
          role="progressbar"
          aria-valuenow={used}
          aria-valuemin={0}
          aria-valuemax={limit}
          data-state={state}
          className="bg-accent h-full data-[state=warning]:bg-amber-500 data-[state=error]:bg-red-500"
          style={{ width: `${String(fillPercent)}%` }}
        />
      </div>
      <span className="text-ink-muted text-[11px]">
        {remainingHint(platformLabel, limit - used)}
      </span>
    </div>
  );
}
