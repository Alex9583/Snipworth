import { useEffect, useEffectEvent, useState } from 'react';

import { Button } from '@/adapters/primary/app/ui/Button';
import { IconBtn } from '@/adapters/primary/app/ui/IconBtn';
import { SaveIcon } from '@/adapters/primary/app/ui/icons';

import { relativeTimeLabel } from './relativeTime';
import { SAVE_DRAFT_BUTTON, shortcutHint } from './SaveDraftButton.strings';

const BOUND_IDLE_REFRESH_MS = 10_000;

export type ModKey = 'mac' | 'pc';

export type SaveBinding =
  | { readonly kind: 'scratch' }
  | {
      readonly kind: 'bound';
      readonly lastSavedAt: Date;
      readonly saveStatus: 'idle' | 'saving' | 'error';
    };

type SaveAction = 'save' | 'flush' | 'retry' | 'noop';

function saveActionFor(binding: SaveBinding): SaveAction {
  if (binding.kind === 'scratch') return 'save';
  if (binding.saveStatus === 'idle') return 'flush';
  if (binding.saveStatus === 'error') return 'retry';
  return 'noop';
}

interface SaveDraftButtonProps {
  readonly binding: SaveBinding;
  readonly modKey: ModKey;
  readonly onSave?: () => void;
  readonly onFlush?: () => void;
  readonly onRetry?: () => void;
  readonly onShowSavedToast?: () => void;
  readonly compact?: boolean;
}

export function SaveDraftButton({
  binding,
  modKey,
  onSave,
  onFlush,
  onRetry,
  onShowSavedToast,
  compact,
}: SaveDraftButtonProps) {
  useSaveShortcut(binding, { onSave, onFlush, onRetry, onShowSavedToast });
  if (compact) {
    return (
      <IconBtn label={SAVE_DRAFT_BUTTON.compactAriaLabel} onClick={onSave}>
        <SaveIcon size={14} />
      </IconBtn>
    );
  }
  if (binding.kind === 'bound' && binding.saveStatus === 'idle') {
    return <BoundIdleButton lastSavedAt={binding.lastSavedAt} onFlush={onFlush} />;
  }
  if (binding.kind === 'bound' && binding.saveStatus === 'saving') {
    return (
      <Button size="sm" disabled aria-busy="true">
        {SAVE_DRAFT_BUTTON.savingLabel}
      </Button>
    );
  }
  if (binding.kind === 'bound' && binding.saveStatus === 'error') {
    return (
      <Button size="sm" variant="outline" onClick={onRetry}>
        {SAVE_DRAFT_BUTTON.errorLabel}
      </Button>
    );
  }
  return (
    <Button size="sm" onClick={onSave} iconLeft={<SaveIcon size={13} />}>
      {SAVE_DRAFT_BUTTON.scratchPrefix}{' '}
      <kbd className="bg-black/15 ml-1 rounded-sm px-1.5 py-px text-[10px]">
        {shortcutHint(modKey)}
      </kbd>
    </Button>
  );
}

interface SaveShortcutCallbacks {
  readonly onSave?: () => void;
  readonly onFlush?: () => void;
  readonly onRetry?: () => void;
  readonly onShowSavedToast?: () => void;
}

function useSaveShortcut(binding: SaveBinding, callbacks: SaveShortcutCallbacks): void {
  const onShortcut = useEffectEvent((event: KeyboardEvent) => {
    const action = saveActionFor(binding);
    if (action === 'noop') return;
    event.preventDefault();
    if (action === 'save') callbacks.onSave?.();
    if (action === 'flush') {
      callbacks.onFlush?.();
      callbacks.onShowSavedToast?.();
    }
    if (action === 'retry') callbacks.onRetry?.();
  });
  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      if (event.key.toLowerCase() !== 's') return;
      if (!(event.metaKey || event.ctrlKey)) return;
      onShortcut(event);
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
    };
  }, []);
}

interface BoundIdleButtonProps {
  readonly lastSavedAt: Date;
  readonly onFlush?: () => void;
}

function BoundIdleButton({ lastSavedAt, onFlush }: BoundIdleButtonProps) {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
    }, BOUND_IDLE_REFRESH_MS);
    return () => {
      clearInterval(id);
    };
  }, []);
  return (
    <Button size="sm" variant="outline" onClick={onFlush}>
      {SAVE_DRAFT_BUTTON.savedPrefix}
      {relativeTimeLabel(lastSavedAt, now)}
    </Button>
  );
}
