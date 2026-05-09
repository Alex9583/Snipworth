import { clsx } from 'clsx';
import { useRef, type KeyboardEvent } from 'react';

export interface SegmentedOption<T extends string | number> {
  readonly value: T;
  readonly label: string;
}

interface SegmentedProps<T extends string | number> {
  readonly label: string;
  readonly value: T;
  readonly options: readonly SegmentedOption<T>[];
  readonly onChange: (value: T) => void;
  readonly className?: string;
}

export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
  className,
}: SegmentedProps<T>) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const focusableIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const moveSelection = (nextIndex: number) => {
    const nextOption = options[nextIndex];
    if (!nextOption) return;
    onChange(nextOption.value);
    buttonRefs.current[nextIndex]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const lastIndex = options.length - 1;
    const current = focusableIndex;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        moveSelection(current === lastIndex ? 0 : current + 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        moveSelection(current === 0 ? lastIndex : current - 1);
        break;
      case 'Home':
        event.preventDefault();
        moveSelection(0);
        break;
      case 'End':
        event.preventDefault();
        moveSelection(lastIndex);
        break;
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className={clsx(
        'border-line bg-elevated inline-flex gap-0.5 rounded-md border p-0.5',
        className,
      )}
    >
      {options.map((option, index) => {
        const checked = index === selectedIndex;
        return (
          <button
            key={String(option.value)}
            ref={(node) => {
              buttonRefs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={index === focusableIndex ? 0 : -1}
            onClick={() => {
              onChange(option.value);
            }}
            className={clsx(
              'inline-flex h-7 items-center justify-center rounded-sm px-2.5 text-xs font-medium transition-colors',
              'focus-visible:ring-accent focus-visible:ring-2 focus-visible:outline-none',
              checked ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
