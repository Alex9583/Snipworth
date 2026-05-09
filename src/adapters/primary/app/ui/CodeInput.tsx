import { clsx } from 'clsx';

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  className?: string;
}

export function CodeInput({ value, onChange, label, placeholder, className }: CodeInputProps) {
  return (
    <textarea
      value={value}
      onChange={(event) => {
        onChange(event.target.value);
      }}
      aria-label={label}
      placeholder={placeholder}
      spellCheck={false}
      className={clsx(
        'border-line bg-surface text-ink placeholder:text-ink-muted w-full resize-none rounded-md border p-3 font-mono text-sm',
        'focus-visible:ring-accent focus-visible:ring-2 focus-visible:outline-none',
        className,
      )}
    />
  );
}
