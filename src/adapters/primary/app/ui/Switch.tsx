import { clsx } from 'clsx';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  className?: string;
}

export function Switch({ checked, onChange, label, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => {
        onChange(!checked);
      }}
      className={clsx(
        'relative inline-flex h-5 w-9 items-center rounded-md transition-colors',
        'focus-visible:ring-accent focus-visible:ring-2 focus-visible:outline-none',
        checked ? 'bg-accent' : 'bg-elevated',
        className,
      )}
    >
      <span
        className={clsx(
          'inline-block h-4 w-4 transform rounded-sm bg-white transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}
