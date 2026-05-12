import { describe, it, expect } from 'vitest';
import { AVAILABLE_THEMES, isAvailableTheme, themesByVariant } from '@/domain/rendering/themes';

describe('isAvailableTheme', () => {
  it('should_return_true_when_name_is_in_the_curated_list', () => {
    expect(isAvailableTheme('github-dark')).toBe(true);
    expect(isAvailableTheme('dracula')).toBe(true);
  });

  it('should_return_false_when_name_is_not_in_the_curated_list', () => {
    expect(isAvailableTheme('unknown-theme')).toBe(false);
    expect(isAvailableTheme('')).toBe(false);
  });
});

describe('themesByVariant', () => {
  it('should_return_only_dark_themes_when_variant_is_dark', () => {
    const darkThemes = themesByVariant('dark');

    expect(darkThemes.length).toBeGreaterThan(0);
    expect(darkThemes.every((theme) => theme.variant === 'dark')).toBe(true);
  });

  it('should_return_only_light_themes_when_variant_is_light', () => {
    const lightThemes = themesByVariant('light');

    expect(lightThemes.length).toBeGreaterThan(0);
    expect(lightThemes.every((theme) => theme.variant === 'light')).toBe(true);
  });

  it('should_partition_AVAILABLE_THEMES_into_dark_and_light_without_overlap', () => {
    const dark = themesByVariant('dark');
    const light = themesByVariant('light');

    expect(dark.length + light.length).toBe(AVAILABLE_THEMES.length);
    const darkNames = new Set(dark.map((theme) => theme.name));
    const lightNames = new Set(light.map((theme) => theme.name));
    for (const name of darkNames) {
      expect(lightNames.has(name)).toBe(false);
    }
  });
});
