import type { FormatResult } from '@/application/use-cases/FormatCode';

import { FORMAT_BUTTON } from './FormatButton.strings';
import { IconBtn } from './IconBtn';

interface FormatButtonProps {
  readonly canFormat: boolean;
  readonly onFormat: () => void;
  readonly status: FormatResult | null;
}

export function FormatButton({ canFormat, onFormat, status }: FormatButtonProps) {
  if (!canFormat) return null;
  return (
    <span className="inline-flex items-center gap-2">
      <IconBtn label={FORMAT_BUTTON.label} onClick={onFormat}>
        <span aria-hidden className="text-sm leading-none">
          {FORMAT_BUTTON.icon}
        </span>
      </IconBtn>
      {status?.kind === 'failed' ? (
        <span role="alert" className="text-ink-muted text-xs">
          {FORMAT_BUTTON.failedMessage}
        </span>
      ) : null}
    </span>
  );
}
