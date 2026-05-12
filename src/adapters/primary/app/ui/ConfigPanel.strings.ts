export const CONFIG_PANEL = {
  themeLabel: 'Theme',
  themeDarkGroupLabel: 'Dark',
  themeLightGroupLabel: 'Light',
  fontFamilyLabel: 'Font family',
  fontSizeLabel: 'Font size',
  backgroundColorLabel: 'Background color',
} as const;

export function pxHintLabel(px: number): string {
  return `${String(px)} px`;
}
