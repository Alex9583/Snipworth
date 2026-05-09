import { clsx } from 'clsx';
import type { HTMLAttributes } from 'react';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('border-line bg-surface rounded-lg border p-4 shadow-sm', className)}
      {...rest}
    />
  );
}
