export const fontFamilies = [
  'JetBrains Mono',
  'Fira Code',
  'Hack',
  'Source Code Pro',
  'Cascadia Code',
] as const;
export type FontFamily = (typeof fontFamilies)[number];

export const windowStyles = ['mac', 'windows', 'none'] as const;
export type WindowStyle = (typeof windowStyles)[number];

export const aspectRatios = ['1:1', '4:5', '16:9', '9:16', 'auto'] as const;
export type AspectRatio = (typeof aspectRatios)[number];

export const exportScales = [1, 2, 4] as const;
export type ExportScale = (typeof exportScales)[number];

export const exportFormats = ['png', 'svg'] as const;
export type ExportFormat = (typeof exportFormats)[number];

export type Background =
  | { readonly type: 'solid'; readonly color: string }
  | {
      readonly type: 'gradient';
      readonly from: string;
      readonly to: string;
      readonly angle: number;
    }
  | { readonly type: 'transparent' };

const FONT_SIZE_RANGE = [8, 96] as const;
const LINE_HEIGHT_RANGE = [0.8, 3] as const;
const PADDING_RANGE = [0, 256] as const;
const RADIUS_RANGE = [0, 64] as const;
const SHADOW_BLUR_RANGE = [0, 100] as const;
const SHADOW_OFFSET_RANGE = [-50, 50] as const;
const ANGLE_RANGE = [0, 360] as const;

export interface RenderConfigInput {
  readonly theme: string;
  readonly fontFamily: FontFamily;
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly paddingX: number;
  readonly paddingY: number;
  readonly borderRadius: number;
  readonly background: Background;
  readonly showWindowControls: boolean;
  readonly windowStyle: WindowStyle;
  readonly showLineNumbers: boolean;
  readonly firstLineNumber: number;
  readonly highlightLines: readonly number[];
  readonly shadow: boolean;
  readonly shadowBlur: number;
  readonly shadowOffsetY: number;
  readonly aspectRatio: AspectRatio;
  readonly exportScale: ExportScale;
  readonly exportFormat: ExportFormat;
}

export interface RenderConfigSnapshot {
  readonly theme: string;
  readonly fontFamily: FontFamily;
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly paddingX: number;
  readonly paddingY: number;
  readonly borderRadius: number;
  readonly background: Background;
  readonly showWindowControls: boolean;
  readonly windowStyle: WindowStyle;
  readonly showLineNumbers: boolean;
  readonly firstLineNumber: number;
  readonly highlightLines: readonly number[];
  readonly shadow: boolean;
  readonly shadowBlur: number;
  readonly shadowOffsetY: number;
  readonly aspectRatio: AspectRatio;
  readonly exportScale: ExportScale;
  readonly exportFormat: ExportFormat;
}

export class InvalidRenderConfig extends Error {
  constructor(reason: string) {
    super(`InvalidRenderConfig: ${reason}`);
    this.name = 'InvalidRenderConfig';
  }
}

export class RenderConfig {
  readonly theme: string;
  readonly fontFamily: FontFamily;
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly paddingX: number;
  readonly paddingY: number;
  readonly borderRadius: number;
  readonly background: Background;
  readonly showWindowControls: boolean;
  readonly windowStyle: WindowStyle;
  readonly showLineNumbers: boolean;
  readonly firstLineNumber: number;
  readonly highlightLines: readonly number[];
  readonly shadow: boolean;
  readonly shadowBlur: number;
  readonly shadowOffsetY: number;
  readonly aspectRatio: AspectRatio;
  readonly exportScale: ExportScale;
  readonly exportFormat: ExportFormat;

  private constructor(props: RenderConfigInput) {
    this.theme = props.theme;
    this.fontFamily = props.fontFamily;
    this.fontSize = props.fontSize;
    this.lineHeight = props.lineHeight;
    this.paddingX = props.paddingX;
    this.paddingY = props.paddingY;
    this.borderRadius = props.borderRadius;
    this.background = props.background;
    this.showWindowControls = props.showWindowControls;
    this.windowStyle = props.windowStyle;
    this.showLineNumbers = props.showLineNumbers;
    this.firstLineNumber = props.firstLineNumber;
    this.highlightLines = props.highlightLines;
    this.shadow = props.shadow;
    this.shadowBlur = props.shadowBlur;
    this.shadowOffsetY = props.shadowOffsetY;
    this.aspectRatio = props.aspectRatio;
    this.exportScale = props.exportScale;
    this.exportFormat = props.exportFormat;
  }

  static from(input: RenderConfigInput): RenderConfig {
    requireNonEmpty(input.theme, 'theme');
    requireMember(input.fontFamily, fontFamilies, 'fontFamily');
    requireRange(input.fontSize, FONT_SIZE_RANGE, 'fontSize');
    requireRange(input.lineHeight, LINE_HEIGHT_RANGE, 'lineHeight');
    requireRange(input.paddingX, PADDING_RANGE, 'paddingX');
    requireRange(input.paddingY, PADDING_RANGE, 'paddingY');
    requireRange(input.borderRadius, RADIUS_RANGE, 'borderRadius');
    requireMember(input.windowStyle, windowStyles, 'windowStyle');
    requireMember(input.aspectRatio, aspectRatios, 'aspectRatio');
    requireMember(input.exportFormat, exportFormats, 'exportFormat');
    requireScale(input.exportScale);
    requireFirstLineNumber(input.firstLineNumber);
    requireHighlightLines(input.highlightLines);
    requireRange(input.shadowBlur, SHADOW_BLUR_RANGE, 'shadowBlur');
    requireRange(input.shadowOffsetY, SHADOW_OFFSET_RANGE, 'shadowOffsetY');
    requireBackground(input.background);

    return new RenderConfig({ ...input, highlightLines: [...input.highlightLines] });
  }

  static fromSnapshot(snapshot: RenderConfigSnapshot): RenderConfig {
    return new RenderConfig({ ...snapshot, highlightLines: [...snapshot.highlightLines] });
  }

  toSnapshot(): RenderConfigSnapshot {
    return {
      theme: this.theme,
      fontFamily: this.fontFamily,
      fontSize: this.fontSize,
      lineHeight: this.lineHeight,
      paddingX: this.paddingX,
      paddingY: this.paddingY,
      borderRadius: this.borderRadius,
      background: this.background,
      showWindowControls: this.showWindowControls,
      windowStyle: this.windowStyle,
      showLineNumbers: this.showLineNumbers,
      firstLineNumber: this.firstLineNumber,
      highlightLines: [...this.highlightLines],
      shadow: this.shadow,
      shadowBlur: this.shadowBlur,
      shadowOffsetY: this.shadowOffsetY,
      aspectRatio: this.aspectRatio,
      exportScale: this.exportScale,
      exportFormat: this.exportFormat,
    };
  }
}

function requireNonEmpty(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new InvalidRenderConfig(`${field} must not be empty`);
  }
}

function requireMember<T extends string>(value: T, allowed: readonly T[], field: string): void {
  if (!allowed.includes(value)) {
    throw new InvalidRenderConfig(`${field} must be one of ${allowed.join(', ')}`);
  }
}

function requireRange(value: number, range: readonly [number, number], field: string): void {
  if (!Number.isFinite(value) || value < range[0] || value > range[1]) {
    throw new InvalidRenderConfig(`${field} must be in [${String(range[0])}, ${String(range[1])}]`);
  }
}

function requireScale(value: ExportScale): void {
  if (!exportScales.includes(value)) {
    throw new InvalidRenderConfig(`exportScale must be one of ${exportScales.join(', ')}`);
  }
}

function requireFirstLineNumber(value: number): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new InvalidRenderConfig('firstLineNumber must be a non-negative integer');
  }
}

function requireHighlightLines(lines: readonly number[]): void {
  const seen = new Set<number>();
  for (const line of lines) {
    if (!Number.isInteger(line) || line < 1) {
      throw new InvalidRenderConfig('highlightLines must contain positive integers');
    }
    if (seen.has(line)) {
      throw new InvalidRenderConfig('highlightLines must not contain duplicates');
    }
    seen.add(line);
  }
}

function requireBackground(bg: Background): void {
  switch (bg.type) {
    case 'solid':
      requireNonEmpty(bg.color, 'background.color');
      return;
    case 'gradient':
      requireNonEmpty(bg.from, 'background.from');
      requireNonEmpty(bg.to, 'background.to');
      requireRange(bg.angle, ANGLE_RANGE, 'background.angle');
      return;
    case 'transparent':
      return;
    default: {
      throw new InvalidRenderConfig(
        `background.type "${String((bg as { type: unknown }).type)}" is not supported`,
      );
    }
  }
}
