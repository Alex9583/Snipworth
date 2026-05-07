import type {
  LoadPrefsOutcome,
  SavePrefsOutcome,
  UserPreferencesStore,
} from '@/application/ports/UserPreferencesStore';
import { UserPreferences } from '@/domain/preferences/UserPreferences';
import { RenderConfig } from '@/domain/rendering/RenderConfig';

import { PREFS_KEY, userPreferencesWireSchema, type UserPreferencesWire } from './storage-format';

export class ChromeStorageSyncPreferences implements UserPreferencesStore {
  async load(): Promise<LoadPrefsOutcome> {
    let raw: unknown;
    try {
      const result = await chrome.storage.sync.get([PREFS_KEY]);
      raw = result[PREFS_KEY];
    } catch (cause) {
      return { kind: 'storage_unavailable', cause };
    }

    if (raw === undefined) {
      return { kind: 'loaded', preferences: UserPreferences.default() };
    }

    const parsed = userPreferencesWireSchema.safeParse(raw);
    if (!parsed.success) {
      return { kind: 'corrupt', cause: parsed.error };
    }

    return { kind: 'loaded', preferences: mergeWithDefaults(parsed.data) };
  }

  async save(preferences: UserPreferences): Promise<SavePrefsOutcome> {
    try {
      await chrome.storage.sync.set({ [PREFS_KEY]: preferences.toSnapshot() });
      return { kind: 'saved' };
    } catch (cause) {
      return { kind: 'storage_unavailable', cause };
    }
  }
}

function mergeWithDefaults(stored: UserPreferencesWire): UserPreferences {
  return UserPreferences.default().with({
    defaultConfig:
      stored.defaultConfig === undefined
        ? undefined
        : RenderConfig.fromSnapshot(stored.defaultConfig),
    defaultPlatform: stored.defaultPlatform,
    autoDetectLanguage: stored.autoDetectLanguage,
    theme: stored.theme,
    onboardingCompleted: stored.onboardingCompleted,
    persistStorageRequested: stored.persistStorageRequested,
    lastExportScale: stored.lastExportScale,
  });
}
