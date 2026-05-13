import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconBtnProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  readonly label: string;
  readonly children: ReactNode;
}

export function IconBtn({ label, children, className, type = 'button', ...rest }: IconBtnProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={clsx(
        'text-ink-muted hover:bg-elevated hover:text-ink inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors',
        'focus-visible:ring-accent focus-visible:ring-2 focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
