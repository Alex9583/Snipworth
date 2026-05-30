import { useEffect, useEffectEvent, useId } from 'react';

import { Button } from '@/adapters/primary/app/ui/Button';

import { IMPORT_MODE_DIALOG } from './ImportModeDialog.strings';

interface ImportModeDialogProps {
  readonly open: boolean;
  readonly incomingCount: number;
  readonly onAdd: () => void;
  readonly onReplace: () => void;
  readonly onCancel: () => void;
}

export function ImportModeDialog({
  open,
  incomingCount,
  onAdd,
  onReplace,
  onCancel,
}: ImportModeDialogProps) {
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
          {IMPORT_MODE_DIALOG.title}
        </h2>
        <p id={descriptionId} className="text-ink-muted mb-2 text-sm leading-relaxed">
          {IMPORT_MODE_DIALOG.body(incomingCount)}
        </p>
        <p className="text-ink-muted mb-5 text-xs leading-relaxed">
          {IMPORT_MODE_DIALOG.replaceWarning}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            {IMPORT_MODE_DIALOG.cancelButton}
          </Button>
          <Button onClick={onReplace} className="bg-red-600 hover:bg-red-700">
            {IMPORT_MODE_DIALOG.replaceButton}
          </Button>
          <Button onClick={onAdd}>{IMPORT_MODE_DIALOG.addButton}</Button>
        </div>
      </div>
    </div>
  );
}
