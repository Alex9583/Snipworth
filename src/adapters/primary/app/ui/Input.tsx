import { clsx } from 'clsx';
import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly icon?: ReactNode;
}

export function Input({ icon, className, ...rest }: InputProps) {
  return (
    <div className={clsx('relative inline-flex w-full items-center', className)}>
      {icon !== undefined ? (
        <span
          className="text-ink-muted pointer-events-none absolute left-3 inline-flex items-center"
          aria-hidden="true"
        >
          {icon}
        </span>
      ) : null}
      <input
        className={clsx(
          'border-line bg-elevated text-ink placeholder:text-ink-muted h-8 w-full rounded-md border text-sm transition-colors',
          'focus-visible:ring-accent focus-visible:ring-2 focus-visible:outline-none',
          icon !== undefined ? 'pr-3 pl-9' : 'px-3',
        )}
        {...rest}
      />
    </div>
  );
}
