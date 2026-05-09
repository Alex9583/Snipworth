import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'default' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  default: 'bg-accent text-white hover:bg-accent-hover',
  outline: 'border border-line text-ink hover:bg-elevated',
  ghost: 'text-ink hover:bg-elevated',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-7 rounded-sm px-2.5 text-xs',
  md: 'h-9 rounded-md px-3.5 text-sm',
  lg: 'h-11 rounded-md px-5 text-base',
};

export function Button({
  variant = 'default',
  size = 'md',
  iconLeft,
  iconRight,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 font-medium transition-colors',
        'disabled:pointer-events-none disabled:opacity-50',
        'focus-visible:ring-accent focus-visible:ring-2 focus-visible:outline-none',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
