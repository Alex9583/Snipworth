import { z } from 'zod';

import { platforms } from '@/domain/drafts/Platform';
import { themeModes } from '@/domain/preferences/UserPreferences';

import { renderConfigWireSchema } from '../rendering/render-config-wire';

export const PREFS_KEY = 'prefs';

export const userPreferencesWireSchema = z.object({
  defaultConfig: renderConfigWireSchema.optional(),
  defaultPlatform: z.enum(platforms).optional(),
  autoDetectLanguage: z.boolean().optional(),
  theme: z.enum(themeModes).optional(),
  onboardingCompleted: z.boolean().optional(),
  persistStorageRequested: z.boolean().optional(),
});

export type UserPreferencesWire = z.infer<typeof userPreferencesWireSchema>;
