import { TITLE_MAX } from '@/domain/limits';

interface TitleInputProps {
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly placeholder: string;
  readonly label: string;
}

export function TitleInput({ value, onChange, placeholder, label }: TitleInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(event) => {
        onChange(event.target.value);
      }}
      placeholder={placeholder}
      aria-label={label}
      maxLength={TITLE_MAX}
      className="text-ink placeholder:text-ink-muted min-w-0 flex-1 border-0 bg-transparent text-sm focus-visible:outline-none"
    />
  );
}
