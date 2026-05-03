import { isPlatform, platforms, type Platform } from '@/domain/drafts/Platform';
import {
  exportScales,
  RenderConfig,
  type ExportScale,
  type RenderConfigSnapshot,
} from '@/domain/rendering/RenderConfig';

export const themeModes = ['light', 'dark', 'system'] as const;
export type ThemeMode = (typeof themeModes)[number];

export interface UserPreferencesInput {
  readonly defaultConfig: RenderConfig;
  readonly defaultPlatform: Platform;
  readonly autoDetectLanguage: boolean;
  readonly theme: ThemeMode;
  readonly onboardingCompleted: boolean;
  readonly persistStorageRequested: boolean;
  readonly lastExportScale: ExportScale;
}

export interface UserPreferencesSnapshot {
  readonly defaultConfig: RenderConfigSnapshot;
  readonly defaultPlatform: Platform;
  readonly autoDetectLanguage: boolean;
  readonly theme: ThemeMode;
  readonly onboardingCompleted: boolean;
  readonly persistStorageRequested: boolean;
  readonly lastExportScale: ExportScale;
}

export class InvalidUserPreferences extends Error {
  constructor(reason: string) {
    super(`InvalidUserPreferences: ${reason}`);
    this.name = 'InvalidUserPreferences';
  }
}

export class UserPreferences {
  readonly defaultConfig: RenderConfig;
  readonly defaultPlatform: Platform;
  readonly autoDetectLanguage: boolean;
  readonly theme: ThemeMode;
  readonly onboardingCompleted: boolean;
  readonly persistStorageRequested: boolean;
  readonly lastExportScale: ExportScale;

  private constructor(props: UserPreferencesInput) {
    this.defaultConfig = props.defaultConfig;
    this.defaultPlatform = props.defaultPlatform;
    this.autoDetectLanguage = props.autoDetectLanguage;
    this.theme = props.theme;
    this.onboardingCompleted = props.onboardingCompleted;
    this.persistStorageRequested = props.persistStorageRequested;
    this.lastExportScale = props.lastExportScale;
  }

  static from(input: UserPreferencesInput): UserPreferences {
    requireMember(input.theme, themeModes, 'theme');
    if (!isPlatform(input.defaultPlatform)) {
      throw new InvalidUserPreferences(`defaultPlatform must be one of ${platforms.join(', ')}`);
    }
    if (!exportScales.includes(input.lastExportScale)) {
      throw new InvalidUserPreferences(`lastExportScale must be one of ${exportScales.join(', ')}`);
    }
    return new UserPreferences(input);
  }

  static default(): UserPreferences {
    return UserPreferences.from({
      defaultConfig: RenderConfig.default(),
      defaultPlatform: 'x',
      autoDetectLanguage: true,
      theme: 'system',
      onboardingCompleted: false,
      persistStorageRequested: false,
      lastExportScale: 2,
    });
  }

  static fromSnapshot(snapshot: UserPreferencesSnapshot): UserPreferences {
    return new UserPreferences({
      ...snapshot,
      defaultConfig: RenderConfig.fromSnapshot(snapshot.defaultConfig),
    });
  }

  with(patch: Partial<UserPreferencesInput>): UserPreferences {
    return UserPreferences.from({
      defaultConfig: patch.defaultConfig ?? this.defaultConfig,
      defaultPlatform: patch.defaultPlatform ?? this.defaultPlatform,
      autoDetectLanguage: patch.autoDetectLanguage ?? this.autoDetectLanguage,
      theme: patch.theme ?? this.theme,
      onboardingCompleted: patch.onboardingCompleted ?? this.onboardingCompleted,
      persistStorageRequested: patch.persistStorageRequested ?? this.persistStorageRequested,
      lastExportScale: patch.lastExportScale ?? this.lastExportScale,
    });
  }

  toSnapshot(): UserPreferencesSnapshot {
    return {
      defaultConfig: this.defaultConfig.toSnapshot(),
      defaultPlatform: this.defaultPlatform,
      autoDetectLanguage: this.autoDetectLanguage,
      theme: this.theme,
      onboardingCompleted: this.onboardingCompleted,
      persistStorageRequested: this.persistStorageRequested,
      lastExportScale: this.lastExportScale,
    };
  }
}

function requireMember<T extends string>(value: T, allowed: readonly T[], field: string): void {
  if (!allowed.includes(value)) {
    throw new InvalidUserPreferences(`${field} must be one of ${allowed.join(', ')}`);
  }
}
