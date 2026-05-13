import type { FontFamily } from '@/domain/rendering/RenderConfig';

const VARIABLE_NAMES: Record<FontFamily, string> = {
  'JetBrains Mono': 'JetBrains Mono Variable',
  'Fira Code': 'Fira Code Variable',
  'Inconsolata': 'Inconsolata Variable',
  'Source Code Pro': 'Source Code Pro Variable',
  'Cascadia Code': 'Cascadia Code Variable',
};

const FALLBACK_CHAIN = `ui-monospace, 'SF Mono', Menlo, Consolas, monospace`;

export function variableNameFor(family: FontFamily): string {
  return VARIABLE_NAMES[family];
}

export function cssFontFamily(family: FontFamily): string {
  return `'${variableNameFor(family)}', '${family}', ${FALLBACK_CHAIN}`;
}
