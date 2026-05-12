import {
  fontFamilies,
  type Background,
  type FontFamily,
  type RenderConfigSnapshot,
} from '@/domain/rendering/RenderConfig';
import { Card } from './Card';
import { Slider } from './Slider';

const CURATED_THEMES = ['github-dark', 'github-light'] as const;

interface ConfigPanelProps {
  value: RenderConfigSnapshot;
  onChange: (patch: Partial<RenderConfigSnapshot>) => void;
}

const FONT_SIZE_MIN = 10;
const FONT_SIZE_MAX = 24;

const FALLBACK_BACKGROUND_COLOR = '#1C1C21';

const FIELD_CLASSES = 'flex flex-col gap-1 text-sm';
const LABEL_TEXT_CLASSES = 'text-ink-muted';
const SELECT_CLASSES = 'bg-elevated text-ink h-8 rounded-sm px-2 text-sm';

export function ConfigPanel({ value, onChange }: ConfigPanelProps) {
  const themeOptions = optionListWith(CURATED_THEMES, value.theme);
  return (
    <Card className="flex flex-col gap-4">
      <SelectField
        label="Theme"
        value={value.theme}
        options={themeOptions}
        onChange={(theme) => {
          onChange({ theme });
        }}
      />
      <SelectField
        label="Font family"
        value={value.fontFamily}
        options={fontFamilies}
        onChange={(fontFamily) => {
          onChange({ fontFamily: fontFamily as FontFamily });
        }}
      />
      <SliderField
        label="Font size"
        value={value.fontSize}
        min={FONT_SIZE_MIN}
        max={FONT_SIZE_MAX}
        onChange={(fontSize) => {
          onChange({ fontSize });
        }}
      />
      <ColorField
        label="Background color"
        value={readSolidColor(value.background)}
        onChange={(color) => {
          onChange({ background: { type: 'solid', color } });
        }}
      />
    </Card>
  );
}

function readSolidColor(background: Background): string {
  return background.type === 'solid' ? background.color : FALLBACK_BACKGROUND_COLOR;
}

function optionListWith(curated: readonly string[], current: string): readonly string[] {
  if (curated.includes(current)) return curated;
  return [current, ...curated];
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (next: string) => void;
}

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <label className={FIELD_CLASSES}>
      <span className={LABEL_TEXT_CLASSES}>{label}</span>
      <select
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className={SELECT_CLASSES}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}

function SliderField({ label, value, min, max, onChange }: SliderFieldProps) {
  return (
    <div className={FIELD_CLASSES}>
      <span className={LABEL_TEXT_CLASSES}>
        {label}: {value}px
      </span>
      <Slider value={value} min={min} max={max} onChange={onChange} label={label} />
    </div>
  );
}

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (next: string) => void;
}

function ColorField({ label, value, onChange }: ColorFieldProps) {
  return (
    <label className={FIELD_CLASSES}>
      <span className={LABEL_TEXT_CLASSES}>{label}</span>
      <input
        type="color"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className="bg-elevated h-8 w-full rounded-sm"
      />
    </label>
  );
}
