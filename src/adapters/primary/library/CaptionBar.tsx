import { useState } from 'react';
import type { ReactNode } from 'react';

import { HashIcon, TypeIcon } from '@/adapters/primary/app/ui/icons';
import { Input } from '@/adapters/primary/app/ui/Input';
import { platformCharLimit } from '@/domain/drafts/platformCharLimit';
import type { Platform } from '@/domain/drafts/Platform';

import { CAPTION_BAR, remainingHint } from './CaptionBar.strings';
import { characterCounterState } from './characterCounterState';
import { platformDisplayLabel } from './platformLabels';
import { splitHashtags } from './splitHashtags';

interface CaptionBarProps {
  readonly caption: string;
  readonly platform: Platform;
  readonly onCaptionChange: (caption: string) => void;
  readonly onHashtagsChange: (hashtags: readonly string[]) => void;
}

export function CaptionBar({
  caption,
  platform,
  onCaptionChange,
  onHashtagsChange,
}: CaptionBarProps) {
  const [hashtagsRaw, setHashtagsRaw] = useState('');
  const hashtags = splitHashtags(hashtagsRaw);
  const used = caption.length + hashtags.join(' ').length;
  const limit = platformCharLimit(platform);
  return (
    <div className="border-line bg-surface flex h-32 shrink-0 items-stretch gap-4 border-t px-6 py-4">
      <CaptionField value={caption} onChange={onCaptionChange} />
      <HashtagsField
        value={hashtagsRaw}
        onChange={(next) => {
          setHashtagsRaw(next);
          onHashtagsChange(splitHashtags(next));
        }}
      />
      <CharacterCounter used={used} limit={limit} platform={platform} />
    </div>
  );
}

interface CaptionFieldProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
}

function CaptionField({ value, onChange }: CaptionFieldProps) {
  const id = 'caption-bar-caption';
  return (
    <div className="flex flex-1 flex-col gap-2">
      <FieldLabel htmlFor={id} icon={<TypeIcon size={11} />}>
        {CAPTION_BAR.captionLabel}
      </FieldLabel>
      <textarea
        id={id}
        aria-label={CAPTION_BAR.captionLabel}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className="border-line bg-elevated text-ink placeholder:text-ink-muted focus-visible:ring-accent h-12 w-full resize-none rounded-md border px-2.5 py-2 text-[13px] focus-visible:ring-2 focus-visible:outline-none"
      />
    </div>
  );
}

interface HashtagsFieldProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
}

function HashtagsField({ value, onChange }: HashtagsFieldProps) {
  const id = 'caption-bar-hashtags';
  return (
    <div className="flex w-90 flex-col gap-2">
      <FieldLabel htmlFor={id} icon={<HashIcon size={11} />}>
        {CAPTION_BAR.hashtagsLabel}
      </FieldLabel>
      <Input
        id={id}
        aria-label={CAPTION_BAR.hashtagsLabel}
        icon={<HashIcon size={13} />}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
    </div>
  );
}

interface FieldLabelProps {
  readonly htmlFor: string;
  readonly icon: ReactNode;
  readonly children: ReactNode;
}

function FieldLabel({ htmlFor, icon, children }: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-ink-muted flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide"
    >
      {icon}
      {children}
    </label>
  );
}

interface CharacterCounterProps {
  readonly used: number;
  readonly limit: number | null;
  readonly platform: Platform;
}

function CharacterCounter({ used, limit, platform }: CharacterCounterProps) {
  if (limit === null) return null;
  const state = characterCounterState(used, limit);
  const fillPercent = Math.min(100, (used / limit) * 100);
  const platformLabel = platformDisplayLabel(platform);
  return (
    <div className="flex w-55 flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-ink-muted text-[11px] font-medium uppercase tracking-wide">
          {CAPTION_BAR.charactersLabel}
        </span>
        <span
          data-testid="character-counter"
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
      <span data-testid="character-counter-hint" className="text-ink-muted text-[11px]">
        {remainingHint(platformLabel, limit - used)}
      </span>
    </div>
  );
}
