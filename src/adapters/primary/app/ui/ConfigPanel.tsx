import type { ReactNode } from 'react';

import {
  fontFamilies,
  type Background,
  type FontFamily,
  type RenderConfigSnapshot,
} from '@/domain/rendering/RenderConfig';
import { Slider } from './Slider';
import { CONFIG_PANEL, pxHintLabel } from './ConfigPanel.strings';

const CURATED_THEMES = ['github-dark', 'github-light'] as const;

const FONT_SIZE_MIN = 10;
const FONT_SIZE_MAX = 24;

const FALLBACK_BACKGROUND_COLOR = '#1C1C21';

const ROW_CLASSES = 'border-line flex flex-col gap-1.5 border-b py-2.5 last:border-b-0';
const ROW_HEADER_CLASSES = 'flex items-center justify-between';
const ROW_LABEL_CLASSES = 'text-ink-muted text-sm';
const ROW_HINT_CLASSES = 'text-ink-muted font-mono text-xs tabular-nums';
const CONTROL_CLASSES = 'bg-elevated text-ink h-8 w-full rounded-sm px-2 text-sm';

interface ConfigPanelProps {
  value: RenderConfigSnapshot;
  onChange: (patch: Partial<RenderConfigSnapshot>) => void;
}

export function ConfigPanel({ value, onChange }: ConfigPanelProps) {
  const themeOptions = optionListWith(CURATED_THEMES, value.theme);
  return (
    <div className="flex flex-col">
      <SelectRow
        label={CONFIG_PANEL.themeLabel}
        value={value.theme}
        options={themeOptions}
        onChange={(theme) => {
          onChange({ theme });
        }}
      />
      <SelectRow
        label={CONFIG_PANEL.fontFamilyLabel}
        value={value.fontFamily}
        options={fontFamilies}
        onChange={(fontFamily) => {
          onChange({ fontFamily: fontFamily as FontFamily });
        }}
      />
      <SliderRow
        label={CONFIG_PANEL.fontSizeLabel}
        value={value.fontSize}
        min={FONT_SIZE_MIN}
        max={FONT_SIZE_MAX}
        onChange={(fontSize) => {
          onChange({ fontSize });
        }}
      />
      <ColorRow
        label={CONFIG_PANEL.backgroundColorLabel}
        value={readSolidColor(value.background)}
        onChange={(color) => {
          onChange({ background: { type: 'solid', color } });
        }}
      />
    </div>
  );
}

function readSolidColor(background: Background): string {
  return background.type === 'solid' ? background.color : FALLBACK_BACKGROUND_COLOR;
}

function optionListWith(curated: readonly string[], current: string): readonly string[] {
  if (curated.includes(current)) return curated;
  return [current, ...curated];
}

interface ConfigRowProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

function ConfigRow({ label, hint, children }: ConfigRowProps) {
  return (
    <div className={ROW_CLASSES}>
      <div className={ROW_HEADER_CLASSES}>
        <span className={ROW_LABEL_CLASSES}>{label}</span>
        {hint !== undefined && <span className={ROW_HINT_CLASSES}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

interface SelectRowProps {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (next: string) => void;
}

function SelectRow({ label, value, options, onChange }: SelectRowProps) {
  return (
    <ConfigRow label={label}>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className={CONTROL_CLASSES}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </ConfigRow>
  );
}

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}

function SliderRow({ label, value, min, max, onChange }: SliderRowProps) {
  return (
    <ConfigRow label={label} hint={pxHintLabel(value)}>
      <Slider value={value} min={min} max={max} onChange={onChange} label={label} />
    </ConfigRow>
  );
}

interface ColorRowProps {
  label: string;
  value: string;
  onChange: (next: string) => void;
}

function ColorRow({ label, value, onChange }: ColorRowProps) {
  return (
    <ConfigRow label={label}>
      <input
        type="color"
        aria-label={label}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className="bg-elevated h-8 w-full rounded-sm"
      />
    </ConfigRow>
  );
}
