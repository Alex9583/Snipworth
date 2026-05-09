import { fontFamilies, type FontFamily } from '@/domain/rendering/RenderConfig';
import { Card } from './Card';
import { Slider } from './Slider';

const bundledThemes = ['github-dark', 'github-light'] as const;
export type ConfigPanelTheme = (typeof bundledThemes)[number];

export interface ConfigPanelValue {
  readonly theme: ConfigPanelTheme;
  readonly fontFamily: FontFamily;
  readonly fontSize: number;
  readonly paddingX: number;
  readonly paddingY: number;
  readonly background: string;
}

interface ConfigPanelProps {
  value: ConfigPanelValue;
  onChange: (patch: Partial<ConfigPanelValue>) => void;
}

const FONT_SIZE_MIN = 10;
const FONT_SIZE_MAX = 24;
const PADDING_MIN = 0;
const PADDING_MAX = 96;

const FIELD_CLASSES = 'flex flex-col gap-1 text-sm';
const LABEL_TEXT_CLASSES = 'text-ink-muted';
const SELECT_CLASSES = 'bg-elevated text-ink h-8 rounded-sm px-2 text-sm';

export function ConfigPanel({ value, onChange }: ConfigPanelProps) {
  return (
    <Card className="flex flex-col gap-4">
      <SelectField
        label="Theme"
        value={value.theme}
        options={bundledThemes}
        onChange={(theme) => {
          onChange({ theme });
        }}
      />
      <SelectField
        label="Font family"
        value={value.fontFamily}
        options={fontFamilies}
        onChange={(fontFamily) => {
          onChange({ fontFamily });
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
      <SliderField
        label="Padding X"
        value={value.paddingX}
        min={PADDING_MIN}
        max={PADDING_MAX}
        onChange={(paddingX) => {
          onChange({ paddingX });
        }}
      />
      <SliderField
        label="Padding Y"
        value={value.paddingY}
        min={PADDING_MIN}
        max={PADDING_MAX}
        onChange={(paddingY) => {
          onChange({ paddingY });
        }}
      />
      <ColorField
        label="Background color"
        value={value.background}
        onChange={(background) => {
          onChange({ background });
        }}
      />
    </Card>
  );
}

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (next: T) => void;
}

function SelectField<T extends string>({ label, value, options, onChange }: SelectFieldProps<T>) {
  return (
    <label className={FIELD_CLASSES}>
      <span className={LABEL_TEXT_CLASSES}>{label}</span>
      <select
        value={value}
        onChange={(event) => {
          onChange(event.target.value as T);
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
