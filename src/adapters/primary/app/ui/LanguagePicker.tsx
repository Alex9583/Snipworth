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
const AUTO_BADGE_LABEL = 'auto';

export function LanguagePicker({
  value,
  detection,
  onChange,
  label = DEFAULT_LABEL,
  className,
}: LanguagePickerProps) {
  const options = optionListFor(value);
  return (
    <div className={clsx('inline-flex items-center gap-1', className)}>
      {detection.kind === 'fallback' ? (
        <Badge>
          <span aria-hidden>⚠</span>
          <span className="ml-1">{FALLBACK_BADGE_LABEL}</span>
        </Badge>
      ) : null}
      {detection.kind === 'auto-detected' ? <Badge>{AUTO_BADGE_LABEL}</Badge> : null}
      <select
        aria-label={label}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className="bg-elevated text-ink h-7 rounded-sm px-2 text-xs"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function optionListFor(currentValue: string): readonly string[] {
  if (PICKER_LANGUAGES.includes(currentValue as (typeof PICKER_LANGUAGES)[number])) {
    return PICKER_LANGUAGES;
  }
  return [currentValue, ...PICKER_LANGUAGES];
}
