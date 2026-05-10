import { clsx } from 'clsx';

import type { DetectionStatus } from '@/application/use-cases/LoadCapturedCode';
import { PICKER_LANGUAGES } from '@/domain/syntax-highlighting/SupportedLanguages';

import { Badge } from './Badge';

interface LanguagePickerProps {
  readonly value: string;
  readonly detection: DetectionStatus;
  readonly onChange: (next: string) => void;
  readonly label?: string;
  readonly className?: string;
}

const DEFAULT_LABEL = 'Language';
const FALLBACK_BADGE_LABEL = 'auto-detected fallback';

export function LanguagePicker({
  value,
  detection,
  onChange,
  label = DEFAULT_LABEL,
  className,
}: LanguagePickerProps) {
  const options = optionListFor(value);
  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      <label className="text-ink-muted flex items-center gap-2 text-xs">
        <span>{label}</span>
        {detection.kind === 'fallback' ? (
          <Badge>
            <span aria-hidden>⚠</span>
            <span className="ml-1">{FALLBACK_BADGE_LABEL}</span>
          </Badge>
        ) : null}
        <select
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          className="bg-elevated text-ink ml-auto h-7 rounded-sm px-2 text-sm"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function optionListFor(currentValue: string): readonly string[] {
  if (PICKER_LANGUAGES.includes(currentValue as (typeof PICKER_LANGUAGES)[number])) {
    return PICKER_LANGUAGES;
  }
  return [currentValue, ...PICKER_LANGUAGES];
}
