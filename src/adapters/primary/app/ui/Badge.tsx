import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  className?: string;
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'border-line bg-elevated text-ink-muted inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[11px] font-medium',
        className,
      )}
    >
      {children}
    </span>
  );
}
