import { z } from 'zod';

import { draftStatuses, type DraftSnapshot } from '@/domain/drafts/Draft';
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
import type { SnippetSnapshot } from '@/domain/snippets/Snippet';

import {
  fillRenderConfigDefaults,
  renderConfigStrictWireSchema,
} from '../rendering/render-config-wire';

// Intentionally broader than the domain's HASHTAG_PATTERN: this guards wire shape, the aggregate owns the semantic rule.
const HASHTAG_BODY_MAX = HASHTAG_MAX_LENGTH - 1;
const HASHTAG_ROW_REGEX = new RegExp(`^#\\S{1,${String(HASHTAG_BODY_MAX)}}$`);

const hashtagsSchema = z
  .array(z.string().max(HASHTAG_MAX_LENGTH).regex(HASHTAG_ROW_REGEX))
  .max(HASHTAG_LIST_MAX);

export const draftRowSchema: z.ZodType<DraftSnapshot> = z.strictObject({
  id: z.string().min(1).max(ID_MAX),
  title: z.string().max(TITLE_MAX),
  code: z.string().max(CODE_MAX),
  language: z.string().min(1).max(LANGUAGE_MAX),
  config: renderConfigStrictWireSchema.transform(fillRenderConfigDefaults),
  caption: z.string().max(CAPTION_MAX),
  hashtags: hashtagsSchema,
  platform: z.enum(platforms),
  status: z.enum(draftStatuses),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const snippetRowSchema: z.ZodType<SnippetSnapshot> = z.strictObject({
  id: z.string().min(1).max(ID_MAX),
  title: z.string().max(TITLE_MAX),
  code: z.string().max(CODE_MAX),
  language: z.string().min(1).max(LANGUAGE_MAX),
  hashtags: hashtagsSchema,
  createdAt: z.number(),
  updatedAt: z.number(),
});
