import { z } from 'zod';

import { platforms } from '@/domain/drafts/Platform';
import { THEME_MAX } from '@/domain/limits';
import { themeModes } from '@/domain/preferences/UserPreferences';
import {
  aspectRatios,
  exportFormats,
  fontFamilies,
  windowStyles,
  type RenderConfigSnapshot,
} from '@/domain/rendering/RenderConfig';

export const PREFS_KEY = 'prefs';

const backgroundSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('solid'), color: z.string() }),
  z.object({
    type: z.literal('gradient'),
    from: z.string(),
    to: z.string(),
    angle: z.number(),
  }),
  z.object({ type: z.literal('transparent') }),
]);

const renderConfigWireSchema: z.ZodType<RenderConfigSnapshot> = z.object({
  theme: z.string().min(1).max(THEME_MAX),
  fontFamily: z.enum(fontFamilies),
  fontSize: z.number(),
  lineHeight: z.number(),
  paddingX: z.number(),
  paddingY: z.number(),
  borderRadius: z.number(),
  background: backgroundSchema,
  showWindowControls: z.boolean(),
  windowStyle: z.enum(windowStyles),
  showLineNumbers: z.boolean(),
  firstLineNumber: z.number(),
  highlightLines: z.array(z.number()),
  shadow: z.boolean(),
  shadowBlur: z.number(),
  shadowOffsetY: z.number(),
  aspectRatio: z.enum(aspectRatios),
  exportScale: z.union([z.literal(1), z.literal(2), z.literal(4)]),
  exportFormat: z.enum(exportFormats),
});

export const userPreferencesWireSchema = z.object({
  defaultConfig: renderConfigWireSchema.optional(),
  defaultPlatform: z.enum(platforms).optional(),
  autoDetectLanguage: z.boolean().optional(),
  theme: z.enum(themeModes).optional(),
  onboardingCompleted: z.boolean().optional(),
  persistStorageRequested: z.boolean().optional(),
  lastExportScale: z.union([z.literal(1), z.literal(2), z.literal(4)]).optional(),
});

export type UserPreferencesWire = z.infer<typeof userPreferencesWireSchema>;
