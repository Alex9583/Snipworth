import { useEffect, useEffectEvent, useId } from 'react';

import { Button } from '@/adapters/primary/app/ui/Button';

import { DELETE_DRAFT_DIALOG } from './DeleteDraftDialog.strings';

interface DeleteDraftDialogProps {
  readonly open: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

export function DeleteDraftDialog({ open, onCancel, onConfirm }: DeleteDraftDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  const handleEscape = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="border-line bg-surface relative z-10 w-full max-w-md rounded-lg border p-6 shadow-xl"
      >
        <h2 id={titleId} className="text-ink mb-2 text-base font-semibold">
          {DELETE_DRAFT_DIALOG.title}
        </h2>
        <p id={descriptionId} className="text-ink-muted mb-5 text-sm leading-relaxed">
          {DELETE_DRAFT_DIALOG.body}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            {DELETE_DRAFT_DIALOG.cancelButton}
          </Button>
          <Button onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            {DELETE_DRAFT_DIALOG.confirmButton}
          </Button>
        </div>
      </div>
    </div>
  );
}
