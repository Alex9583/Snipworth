import type { UserPreferences } from '@/domain/preferences/UserPreferences';

export type LoadPrefsOutcome =
  | { readonly kind: 'loaded'; readonly preferences: UserPreferences }
  | { readonly kind: 'corrupt'; readonly cause: unknown }
  | { readonly kind: 'storage_unavailable'; readonly cause: unknown };

export type SavePrefsOutcome =
  | { readonly kind: 'saved' }
  | { readonly kind: 'storage_unavailable'; readonly cause: unknown };

export interface UserPreferencesStore {
  load(): Promise<LoadPrefsOutcome>;
  save(preferences: UserPreferences): Promise<SavePrefsOutcome>;
}
