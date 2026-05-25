import type { ReactNode } from 'react';

import { isPlatform, platforms, type Platform } from '@/domain/drafts/Platform';
import { platformDisplayLabel } from '@/adapters/primary/shared/platformLabels';
import {
  ANGLE_RANGE,
  CANVAS_PADDING_RANGE,
  fontFamilies,
  FONT_SIZE_RANGE,
  type Background,
  type FontFamily,
  type RenderConfigSnapshot,
} from '@/domain/rendering/RenderConfig';
import { isAvailableTheme, themesByVariant } from '@/domain/rendering/themes';
import { Slider } from './Slider';
import {
  CONFIG_PANEL,
  degreeHintLabel,
  percentHintLabel,
  pxHintLabel,
} from './ConfigPanel.strings';

const DARK_THEMES = themesByVariant('dark');
const LIGHT_THEMES = themesByVariant('light');

const [FONT_SIZE_MIN, FONT_SIZE_MAX] = FONT_SIZE_RANGE;
const [CANVAS_PADDING_MIN, CANVAS_PADDING_MAX] = CANVAS_PADDING_RANGE;
const [ANGLE_MIN, ANGLE_MAX] = ANGLE_RANGE;

const FALLBACK_BACKGROUND_COLOR = '#1C1C21';

const ROW_CLASSES = 'border-line flex flex-col gap-1.5 border-b py-2.5 last:border-b-0';
const ROW_HEADER_CLASSES = 'flex items-center justify-between';
const ROW_LABEL_CLASSES = 'text-ink-muted text-sm';
const ROW_HINT_CLASSES = 'text-ink-muted font-mono text-xs tabular-nums';
const CONTROL_CLASSES = 'bg-elevated text-ink h-8 w-full rounded-sm px-2 text-sm';

const BACKGROUND_TYPES = ['solid', 'gradient', 'transparent'] as const;

interface ConfigPanelProps {
  value: RenderConfigSnapshot;
  onChange: (patch: Partial<RenderConfigSnapshot>) => void;
  defaultPlatform: Platform;
  onDefaultPlatformChange: (next: Platform) => void;
}

export function ConfigPanel({
  value,
  onChange,
  defaultPlatform,
  onDefaultPlatformChange,
}: ConfigPanelProps) {
  return (
    <div className="flex flex-col">
      <ThemeRow
        value={value.theme}
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
      <BackgroundPickerRow
        label={CONFIG_PANEL.canvasBackgroundLabel}
        value={value.canvasBackground}
        onChange={(canvasBackground) => {
          onChange({ canvasBackground });
        }}
      />
      <SliderRow
        label={CONFIG_PANEL.canvasPaddingLabel}
        hint={percentHintLabel(value.canvasPadding)}
        value={value.canvasPadding}
        min={CANVAS_PADDING_MIN}
        max={CANVAS_PADDING_MAX}
        onChange={(canvasPadding) => {
          onChange({ canvasPadding });
        }}
      />
      <PlatformRow value={defaultPlatform} onChange={onDefaultPlatformChange} />
    </div>
  );
}

function readSolidColor(background: Background): string {
  return background.type === 'solid' ? background.color : FALLBACK_BACKGROUND_COLOR;
}

function backgroundTypeLabel(type: Background['type']): string {
  switch (type) {
    case 'solid':
      return CONFIG_PANEL.backgroundTypeSolid;
    case 'gradient':
      return CONFIG_PANEL.backgroundTypeGradient;
    case 'transparent':
      return CONFIG_PANEL.backgroundTypeTransparent;
  }
}

interface ThemeRowProps {
  value: string;
  onChange: (next: string) => void;
}

function ThemeRow({ value, onChange }: ThemeRowProps) {
  const showFallback = !isAvailableTheme(value);
  return (
    <ConfigRow label={CONFIG_PANEL.themeLabel}>
      <select
        aria-label={CONFIG_PANEL.themeLabel}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        className={CONTROL_CLASSES}
      >
        {showFallback && <option value={value}>{value}</option>}
        <optgroup label={CONFIG_PANEL.themeDarkGroupLabel}>
          {DARK_THEMES.map((theme) => (
            <option key={theme.name} value={theme.name}>
              {theme.displayName}
            </option>
          ))}
        </optgroup>
        <optgroup label={CONFIG_PANEL.themeLightGroupLabel}>
          {LIGHT_THEMES.map((theme) => (
            <option key={theme.name} value={theme.name}>
              {theme.displayName}
            </option>
          ))}
        </optgroup>
      </select>
    </ConfigRow>
  );
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
  hint?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (next: number) => void;
}

function SliderRow({ label, hint, value, min, max, step, onChange }: SliderRowProps) {
  return (
    <ConfigRow label={label} hint={hint ?? pxHintLabel(value)}>
      <Slider value={value} min={min} max={max} step={step} onChange={onChange} label={label} />
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

interface BackgroundPickerRowProps {
  label: string;
  value: Background;
  onChange: (next: Background) => void;
}

function switchBackgroundType(current: Background, next: Background['type']): Background {
  switch (next) {
    case 'solid':
      return { type: 'solid', color: readSolidColor(current) };
    case 'gradient':
      return {
        type: 'gradient',
        from: current.type === 'gradient' ? current.from : readSolidColor(current),
        to: current.type === 'gradient' ? current.to : FALLBACK_BACKGROUND_COLOR,
        angle: current.type === 'gradient' ? current.angle : 135,
      };
    case 'transparent':
      return { type: 'transparent' };
  }
}

function BackgroundPickerRow({ label, value, onChange }: BackgroundPickerRowProps) {
  return (
    <ConfigRow label={label}>
      <select
        aria-label={CONFIG_PANEL.canvasBackgroundTypeLabel}
        value={value.type}
        onChange={(event) => {
          onChange(switchBackgroundType(value, event.target.value as Background['type']));
        }}
        className={CONTROL_CLASSES}
      >
        {BACKGROUND_TYPES.map((type) => (
          <option key={type} value={type}>
            {backgroundTypeLabel(type)}
          </option>
        ))}
      </select>
      {value.type === 'solid' && (
        <input
          type="color"
          aria-label={label}
          value={value.color}
          onChange={(event) => {
            onChange({ type: 'solid', color: event.target.value });
          }}
          className="bg-elevated h-8 w-full rounded-sm"
        />
      )}
      {value.type === 'gradient' && <GradientControls value={value} onChange={onChange} />}
    </ConfigRow>
  );
}

interface GradientControlsProps {
  value: Extract<Background, { type: 'gradient' }>;
  onChange: (next: Background) => void;
}

function GradientControls({ value, onChange }: GradientControlsProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className={ROW_LABEL_CLASSES}>{CONFIG_PANEL.gradientFromLabel}</span>
        <input
          type="color"
          aria-label={CONFIG_PANEL.gradientFromLabel}
          value={value.from}
          onChange={(event) => {
            onChange({ ...value, from: event.target.value });
          }}
          className="bg-elevated h-8 flex-1 rounded-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className={ROW_LABEL_CLASSES}>{CONFIG_PANEL.gradientToLabel}</span>
        <input
          type="color"
          aria-label={CONFIG_PANEL.gradientToLabel}
          value={value.to}
          onChange={(event) => {
            onChange({ ...value, to: event.target.value });
          }}
          className="bg-elevated h-8 flex-1 rounded-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className={ROW_LABEL_CLASSES}>{CONFIG_PANEL.gradientAngleLabel}</span>
        <span className={ROW_HINT_CLASSES}>{degreeHintLabel(value.angle)}</span>
      </div>
      <Slider
        value={value.angle}
        min={ANGLE_MIN}
        max={ANGLE_MAX}
        onChange={(angle) => {
          onChange({ ...value, angle });
        }}
        label={CONFIG_PANEL.gradientAngleLabel}
      />
    </div>
  );
}

interface PlatformRowProps {
  value: Platform;
  onChange: (next: Platform) => void;
}

function PlatformRow({ value, onChange }: PlatformRowProps) {
  return (
    <ConfigRow label={CONFIG_PANEL.defaultPlatformLabel}>
      <select
        aria-label={CONFIG_PANEL.defaultPlatformLabel}
        value={value}
        onChange={(event) => {
          const value = event.target.value;
          if (isPlatform(value)) onChange(value);
        }}
        className={CONTROL_CLASSES}
      >
        {platforms.map((p) => (
          <option key={p} value={p}>
            {platformDisplayLabel(p)}
          </option>
        ))}
      </select>
    </ConfigRow>
  );
}
