export const AVAILABLE_THEMES = [
  { name: 'github-dark', displayName: 'GitHub Dark', variant: 'dark' },
  { name: 'dracula', displayName: 'Dracula', variant: 'dark' },
  { name: 'one-dark-pro', displayName: 'One Dark Pro', variant: 'dark' },
  { name: 'tokyo-night', displayName: 'Tokyo Night', variant: 'dark' },
  { name: 'monokai', displayName: 'Monokai', variant: 'dark' },
  { name: 'catppuccin-mocha', displayName: 'Catppuccin Mocha', variant: 'dark' },
  { name: 'vitesse-dark', displayName: 'Vitesse Dark', variant: 'dark' },
  { name: 'night-owl', displayName: 'Night Owl', variant: 'dark' },
  { name: 'github-light', displayName: 'GitHub Light', variant: 'light' },
  { name: 'min-light', displayName: 'Min Light', variant: 'light' },
  { name: 'vitesse-light', displayName: 'Vitesse Light', variant: 'light' },
  { name: 'catppuccin-latte', displayName: 'Catppuccin Latte', variant: 'light' },
] as const;

export type ThemeName = (typeof AVAILABLE_THEMES)[number]['name'];
export type ThemeVariant = (typeof AVAILABLE_THEMES)[number]['variant'];
export type ThemeOption = (typeof AVAILABLE_THEMES)[number];

export function isAvailableTheme(name: string): name is ThemeName {
  return AVAILABLE_THEMES.some((theme) => theme.name === name);
}

export function themesByVariant(variant: ThemeVariant): readonly ThemeOption[] {
  return AVAILABLE_THEMES.filter((theme) => theme.variant === variant);
}
