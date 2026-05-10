import { describe, it, expect } from 'vitest';

import {
  InvalidUserPreferences,
  UserPreferences,
  themeModes,
  type UserPreferencesInput,
} from '@/domain/preferences/UserPreferences';
import { RenderConfig } from '@/domain/rendering/RenderConfig';

const validInput: UserPreferencesInput = {
  defaultConfig: RenderConfig.default(),
  defaultPlatform: 'x',
  autoDetectLanguage: true,
  theme: 'system',
  onboardingCompleted: false,
  persistStorageRequested: false,
};

describe('UserPreferences.default', () => {
  it('should_match_the_specification_baseline_values', () => {
    const snapshot = UserPreferences.default().toSnapshot();
    expect(snapshot.defaultPlatform).toBe('x');
    expect(snapshot.autoDetectLanguage).toBe(true);
    expect(snapshot.theme).toBe('system');
    expect(snapshot.onboardingCompleted).toBe(false);
    expect(snapshot.persistStorageRequested).toBe(false);
    expect(snapshot.defaultConfig).toEqual(RenderConfig.default().toSnapshot());
  });
});

describe('UserPreferences.from — happy path', () => {
  it('should_carry_every_input_field_into_the_value_object', () => {
    const prefs = UserPreferences.from({
      ...validInput,
      theme: 'dark',
      autoDetectLanguage: false,
      onboardingCompleted: true,
      persistStorageRequested: true,
      defaultPlatform: 'linkedin',
    });
    expect(prefs.toSnapshot()).toEqual({
      defaultConfig: RenderConfig.default().toSnapshot(),
      defaultPlatform: 'linkedin',
      autoDetectLanguage: false,
      theme: 'dark',
      onboardingCompleted: true,
      persistStorageRequested: true,
    });
  });

  it('should_accept_every_supported_theme_mode', () => {
    for (const mode of themeModes) {
      const prefs = UserPreferences.from({ ...validInput, theme: mode });
      expect(prefs.toSnapshot().theme).toBe(mode);
    }
  });
});

describe('UserPreferences.from — invariants', () => {
  it('should_reject_an_unknown_theme_mode', () => {
    expect(() => UserPreferences.from({ ...validInput, theme: 'midnight' as never })).toThrow(
      InvalidUserPreferences,
    );
    expect(() => UserPreferences.from({ ...validInput, theme: 'midnight' as never })).toThrow(
      /theme/,
    );
  });

  it('should_reject_an_unknown_defaultPlatform', () => {
    expect(() =>
      UserPreferences.from({ ...validInput, defaultPlatform: 'mastodon' as never }),
    ).toThrow(/defaultPlatform/);
  });
});

describe('UserPreferences.with', () => {
  it('should_return_a_new_instance_with_overridden_fields', () => {
    const prefs = UserPreferences.from(validInput);
    const next = prefs.with({ theme: 'dark', onboardingCompleted: true });
    expect(next.toSnapshot()).toEqual({
      ...prefs.toSnapshot(),
      theme: 'dark',
      onboardingCompleted: true,
    });
  });

  it('should_preserve_unspecified_fields', () => {
    const prefs = UserPreferences.from(validInput);
    const next = prefs.with({ persistStorageRequested: true });
    expect(next.toSnapshot()).toEqual({
      ...prefs.toSnapshot(),
      persistStorageRequested: true,
    });
  });

  it('should_treat_explicit_false_as_a_real_change', () => {
    const startedTrue = UserPreferences.from({ ...validInput, autoDetectLanguage: true });
    const next = startedTrue.with({ autoDetectLanguage: false });
    expect(next.toSnapshot().autoDetectLanguage).toBe(false);
  });

  it('should_validate_the_resulting_state', () => {
    const prefs = UserPreferences.from(validInput);
    expect(() => prefs.with({ theme: 'midnight' as never })).toThrow(InvalidUserPreferences);
  });

  it('should_not_mutate_the_source_preferences', () => {
    const prefs = UserPreferences.from(validInput);
    prefs.with({ theme: 'dark' });
    expect(prefs.toSnapshot().theme).toBe('system');
  });
});

describe('UserPreferences.toSnapshot / fromSnapshot', () => {
  it('should_round_trip_a_snapshot_back_to_an_equivalent_instance', () => {
    const original = UserPreferences.from({
      ...validInput,
      theme: 'dark',
      defaultPlatform: 'instagram',
    });
    const round = UserPreferences.fromSnapshot(original.toSnapshot());
    expect(round.toSnapshot()).toEqual(original.toSnapshot());
  });
});
