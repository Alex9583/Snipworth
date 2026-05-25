import { useEffect, useEffectEvent } from 'react';

import { Button } from '@/adapters/primary/app/ui/Button';

import { SAVE_DRAFT_TOAST } from './SaveDraftToast.strings';

export const AUTO_DISMISS_MS = 6_000;

interface SaveDraftToastProps {
  readonly visible: boolean;
  readonly onOpen: () => void;
  readonly onDismiss: () => void;
}

export function SaveDraftToast({ visible, onOpen, onDismiss }: SaveDraftToastProps) {
  const handleAutoDismiss = useEffectEvent(() => {
    onDismiss();
  });
  useEffect(() => {
    if (!visible) return;
    const timeoutId = setTimeout(handleAutoDismiss, AUTO_DISMISS_MS);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [visible]);

  if (!visible) return null;
  const handleOpen = (): void => {
    onOpen();
    onDismiss();
  };
  return (
    <div
      role="status"
      className="border-line bg-elevated text-ink flex items-center justify-between gap-3 rounded-md border px-3.5 py-2.5 text-sm"
    >
      <p>{SAVE_DRAFT_TOAST.message}</p>
      <Button variant="outline" size="sm" onClick={handleOpen}>
        {SAVE_DRAFT_TOAST.openButton}
      </Button>
    </div>
  );
}
