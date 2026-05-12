export const CONFIG_PANEL = {
  themeLabel: 'Theme',
  fontFamilyLabel: 'Font family',
  fontSizeLabel: 'Font size',
  backgroundColorLabel: 'Background color',
} as const;

export function pxHintLabel(px: number): string {
  return `${String(px)} px`;
}
