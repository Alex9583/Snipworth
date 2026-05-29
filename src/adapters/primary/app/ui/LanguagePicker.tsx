import { clsx } from 'clsx';

import { languageDisplayLabel } from '@/adapters/primary/shared/languageLabels';
import type { DetectionStatus } from '@/application/use-cases/LoadCapturedCode';
import { PICKER_LANGUAGES } from '@/domain/syntax-highlighting/SupportedLanguages';

import { Badge } from './Badge';
import { LANGUAGE_PICKER } from './LanguagePicker.strings';

interface LanguagePickerProps {
  readonly value: string;
  readonly detection: DetectionStatus;
  readonly onChange: (next: string) => void;
  readonly onAutoDetect: () => void;
  readonly label?: string;
  readonly className?: string;
}

const AUTO_OPTION_VALUE = '__auto__';

export function LanguagePicker({
  value,
  detection,
  onChange,
  onAutoDetect,
  label = LANGUAGE_PICKER.defaultLabel,
  className,
}: LanguagePickerProps) {
  const options = optionListFor(value);
  return (
    <div className={clsx('inline-flex items-center gap-1', className)}>
      {detection.kind === 'fallback' ? (
        <Badge>
          <span aria-hidden>⚠</span>
          <span className="ml-1">{LANGUAGE_PICKER.fallbackBadgeLabel}</span>
        </Badge>
      ) : null}
      {detection.kind === 'auto-detected' ? <Badge>{LANGUAGE_PICKER.autoBadgeLabel}</Badge> : null}
      <select
        aria-label={label}
        value={value}
        onChange={(event) => {
          const selected = event.target.value;
          if (selected === AUTO_OPTION_VALUE) {
            onAutoDetect();
            return;
          }
          onChange(selected);
        }}
        className="bg-elevated text-ink h-7 rounded-sm px-2 text-xs"
      >
        {detection.kind === 'manual' ? (
          <option value={AUTO_OPTION_VALUE}>{LANGUAGE_PICKER.autoOptionLabel}</option>
        ) : null}
        {options.map((option) => (
          <option key={option} value={option}>
            {languageDisplayLabel(option)}
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
