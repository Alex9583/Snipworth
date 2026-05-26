import { z } from 'zod';

import type { ExportBundle } from '@/application/use-cases/ExportAllDrafts';
import { draftStatuses } from '@/domain/drafts/Draft';
import { platforms } from '@/domain/drafts/Platform';
import {
  CAPTION_MAX,
  CODE_MAX,
  HASHTAG_LIST_MAX,
  HASHTAG_MAX_LENGTH,
  ID_MAX,
  LANGUAGE_MAX,
  TITLE_MAX,
} from '@/domain/limits';
import {
  exportFormats,
  fixedAspectRatios,
  fontFamilies,
  windowStyles,
} from '@/domain/rendering/RenderConfig';

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

const aspectRatioSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('fixed'), ratio: z.enum(fixedAspectRatios) }),
  z.object({ kind: z.literal('auto') }),
]);

const renderConfigSchema = z.object({
  theme: z.string().min(1),
  fontFamily: z.enum(fontFamilies),
  fontSize: z.number(),
  lineHeight: z.number(),
  borderRadius: z.number(),
  background: backgroundSchema,
  canvasBackground: backgroundSchema,
  canvasPadding: z.number(),
  showWindowControls: z.boolean(),
  windowStyle: z.enum(windowStyles),
  showLineNumbers: z.boolean(),
  firstLineNumber: z.number().int().min(0),
  highlightLines: z.array(z.number().int().min(1)),
  shadow: z.boolean(),
  shadowBlur: z.number(),
  shadowOffsetY: z.number(),
  titleColor: z.string(),
  titleFontSize: z.number(),
  aspectRatio: aspectRatioSchema,
  exportScale: z.union([z.literal(1), z.literal(2), z.literal(4)]),
  exportFormat: z.enum(exportFormats),
});

const draftSnapshotSchema = z.object({
  id: z.string().min(1).max(ID_MAX),
  title: z.string().max(TITLE_MAX),
  code: z.string().max(CODE_MAX),
  language: z.string().min(1).max(LANGUAGE_MAX),
  config: renderConfigSchema,
  caption: z.string().max(CAPTION_MAX),
  hashtags: z.array(z.string().max(HASHTAG_MAX_LENGTH)).max(HASHTAG_LIST_MAX),
  platform: z.enum(platforms),
  status: z.enum(draftStatuses),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const DRAFTS_IMPORT_MAX = 10_000;

export const exportBundleSchema: z.ZodType<ExportBundle> = z.object({
  version: z.literal(1),
  exportedAt: z.number(),
  drafts: z.array(draftSnapshotSchema).max(DRAFTS_IMPORT_MAX),
});
