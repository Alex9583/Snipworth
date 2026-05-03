import { z } from 'zod';

import { draftStatuses, type DraftSnapshot } from '@/domain/drafts/Draft';
import { platforms } from '@/domain/drafts/Platform';
import {
  CAPTION_MAX,
  CODE_MAX,
  ID_MAX,
  LANGUAGE_MAX,
  TAG_LIST_MAX,
  TAG_MAX,
  THEME_MAX,
  TITLE_MAX,
} from '@/domain/limits';
import {
  aspectRatios,
  exportFormats,
  fontFamilies,
  windowStyles,
  type RenderConfigSnapshot,
} from '@/domain/rendering/RenderConfig';
import type { SnippetSnapshot } from '@/domain/snippets/Snippet';

function isBlobLike(value: unknown): value is Blob {
  if (value instanceof Blob) return true;
  if (value === null || typeof value !== 'object') return false;
  const candidate = value as { arrayBuffer?: unknown; size?: unknown; type?: unknown };
  return (
    typeof candidate.arrayBuffer === 'function' &&
    typeof candidate.size === 'number' &&
    typeof candidate.type === 'string'
  );
}

const backgroundSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('solid'), color: z.string() }),
  z.strictObject({
    type: z.literal('gradient'),
    from: z.string(),
    to: z.string(),
    angle: z.number(),
  }),
  z.strictObject({ type: z.literal('transparent') }),
]);

const renderConfigSnapshotSchema: z.ZodType<RenderConfigSnapshot> = z.strictObject({
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

export const draftRowSchema: z.ZodType<DraftSnapshot> = z.strictObject({
  id: z.string().min(1).max(ID_MAX),
  title: z.string().max(TITLE_MAX),
  code: z.string().max(CODE_MAX),
  language: z.string().min(1).max(LANGUAGE_MAX),
  config: renderConfigSnapshotSchema,
  caption: z.string().max(CAPTION_MAX),
  hashtags: z.array(z.string().max(TAG_MAX)).max(TAG_LIST_MAX),
  platform: z.enum(platforms),
  thumbnail: z.union([z.custom<Blob>(isBlobLike, { message: 'expected Blob' }), z.null()]),
  tags: z.array(z.string().max(TAG_MAX)).max(TAG_LIST_MAX),
  status: z.enum(draftStatuses),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const snippetRowSchema: z.ZodType<SnippetSnapshot> = z.strictObject({
  id: z.string().min(1).max(ID_MAX),
  title: z.string().max(TITLE_MAX),
  code: z.string().max(CODE_MAX),
  language: z.string().min(1).max(LANGUAGE_MAX),
  tags: z.array(z.string().max(TAG_MAX)).max(TAG_LIST_MAX),
  createdAt: z.number(),
  updatedAt: z.number(),
});
