import { describe, it, expect } from 'vitest';

import { queueStorageFault } from '../../../setup/chrome-mock';
import { ChromeStorageSyncPreferences } from '@/adapters/secondary/preferences/ChromeStorageSyncPreferences';
import { PREFS_KEY } from '@/adapters/secondary/preferences/storage-format';
import { UserPreferences } from '@/domain/preferences/UserPreferences';
import { RenderConfig } from '@/domain/rendering/RenderConfig';

describe('ChromeStorageSyncPreferences — load', () => {
  it('should_return_defaults_when_storage_is_empty', async () => {
    const store = new ChromeStorageSyncPreferences();

    const outcome = await store.load();

    expect(outcome).toEqual({
      kind: 'loaded',
      preferences: UserPreferences.default(),
    });
  });

  it('should_merge_defaults_when_stored_data_is_partial', async () => {
    await chrome.storage.sync.set({
      [PREFS_KEY]: { theme: 'dark', persistStorageRequested: true },
    });
    const store = new ChromeStorageSyncPreferences();

    const outcome = await store.load();

    if (outcome.kind !== 'loaded') {
      throw new Error(`expected loaded, got ${outcome.kind}`);
    }
    const baseline = UserPreferences.default().toSnapshot();
    expect(outcome.preferences.toSnapshot()).toEqual({
      ...baseline,
      theme: 'dark',
      persistStorageRequested: true,
    });
  });

  it('should_ignore_unknown_fields_for_forward_compatibility', async () => {
    await chrome.storage.sync.set({
      [PREFS_KEY]: { theme: 'dark', futureField: 'whatever' },
    });
    const store = new ChromeStorageSyncPreferences();

    const outcome = await store.load();

    if (outcome.kind !== 'loaded') {
      throw new Error(`expected loaded, got ${outcome.kind}`);
    }
    expect(outcome.preferences.toSnapshot().theme).toBe('dark');
  });

  it('should_fill_default_aspectRatio_when_stored_renderConfig_predates_the_field', async () => {
    const { aspectRatio: _stripped, ...legacyRenderConfig } = RenderConfig.default().toSnapshot();
    await chrome.storage.sync.set({
      [PREFS_KEY]: { defaultConfig: legacyRenderConfig },
    });
    const store = new ChromeStorageSyncPreferences();

    const outcome = await store.load();

    if (outcome.kind !== 'loaded') {
      throw new Error(`expected loaded, got ${outcome.kind}`);
    }
    expect(outcome.preferences.defaultConfig.aspectRatio).toEqual({ kind: 'auto' });
  });

  it('should_report_corrupt_when_stored_aspectRatio_has_an_invalid_kind', async () => {
    const baseline = RenderConfig.default().toSnapshot();
    await chrome.storage.sync.set({
      [PREFS_KEY]: { defaultConfig: { ...baseline, aspectRatio: { kind: 'unknown' } } },
    });
    const store = new ChromeStorageSyncPreferences();

    const outcome = await store.load();

    expect(outcome.kind).toBe('corrupt');
  });

  it('should_report_corrupt_when_a_known_field_has_an_invalid_value', async () => {
    await chrome.storage.sync.set({ [PREFS_KEY]: { theme: 'midnight' } });
    const store = new ChromeStorageSyncPreferences();

    const outcome = await store.load();

    expect(outcome.kind).toBe('corrupt');
  });

  it('should_report_storage_unavailable_when_the_read_fails', async () => {
    const cause = new Error('quota_exceeded');
    queueStorageFault({ area: 'sync', op: 'get', cause });
    const store = new ChromeStorageSyncPreferences();

    const outcome = await store.load();

    expect(outcome).toEqual({ kind: 'storage_unavailable', cause });
  });
});

describe('ChromeStorageSyncPreferences — save', () => {
  it('should_persist_a_user_preferences_snapshot', async () => {
    const store = new ChromeStorageSyncPreferences();
    const prefs = UserPreferences.default().with({ theme: 'dark', persistStorageRequested: true });

    const outcome = await store.save(prefs);

    expect(outcome).toEqual({ kind: 'saved' });
    const stored = await chrome.storage.sync.get([PREFS_KEY]);
    expect(stored[PREFS_KEY]).toEqual(prefs.toSnapshot());
  });

  it('should_let_a_subsequent_load_observe_the_save', async () => {
    const store = new ChromeStorageSyncPreferences();
    const prefs = UserPreferences.default().with({
      theme: 'light',
      onboardingCompleted: true,
      defaultPlatform: 'thread',
    });

    await store.save(prefs);
    const outcome = await store.load();

    if (outcome.kind !== 'loaded') {
      throw new Error(`expected loaded, got ${outcome.kind}`);
    }
    expect(outcome.preferences.toSnapshot()).toEqual(prefs.toSnapshot());
  });

  it('should_report_storage_unavailable_when_the_write_fails', async () => {
    const cause = new Error('quota_bytes_per_item');
    queueStorageFault({ area: 'sync', op: 'set', cause });
    const store = new ChromeStorageSyncPreferences();

    const outcome = await store.save(UserPreferences.default());

    expect(outcome).toEqual({ kind: 'storage_unavailable', cause });
  });
});
