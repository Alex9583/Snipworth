export const CONFIG_PANEL = {
  sectionCodeAppearance: 'Code Appearance',
  sectionCanvas: 'Canvas',
  sectionTitle: 'Title',
  sectionPreferences: 'Preferences',
  themeLabel: 'Theme',
  themeDarkGroupLabel: 'Dark',
  themeLightGroupLabel: 'Light',
  fontFamilyLabel: 'Font family',
  fontSizeLabel: 'Font size',
  backgroundColorLabel: 'Background color',
  canvasBackgroundLabel: 'Canvas background',
  canvasBackgroundTypeLabel: 'Canvas background type',
  canvasPaddingLabel: 'Canvas padding',
  titleColorLabel: 'Title color',
  titleFontSizeLabel: 'Title size',
  defaultPlatformLabel: 'Default platform',
  backgroundTypeSolid: 'Solid',
  backgroundTypeGradient: 'Gradient',
  backgroundTypeTransparent: 'Transparent',
  gradientFromLabel: 'From',
  gradientToLabel: 'To',
  gradientAngleLabel: 'Angle',
} as const;

export function pxHintLabel(px: number): string {
  return `${String(px)} px`;
}

export function percentHintLabel(value: number): string {
  return `${String(value)}%`;
}

export function degreeHintLabel(value: number): string {
  return `${String(value)}°`;
}
