import type {
  LoadPrefsOutcome,
  SavePrefsOutcome,
  UserPreferencesStore,
} from '@/application/ports/UserPreferencesStore';
import { UserPreferences } from '@/domain/preferences/UserPreferences';

export class FakeUserPreferencesStore implements UserPreferencesStore {
  readonly saves: UserPreferences[] = [];
  private current: UserPreferences;

  constructor(initial: UserPreferences = UserPreferences.default()) {
    this.current = initial;
  }

  load(): Promise<LoadPrefsOutcome> {
    return Promise.resolve({ kind: 'loaded', preferences: this.current });
  }

  save(preferences: UserPreferences): Promise<SavePrefsOutcome> {
    this.saves.push(preferences);
    this.current = preferences;
    return Promise.resolve({ kind: 'saved' });
  }
}
