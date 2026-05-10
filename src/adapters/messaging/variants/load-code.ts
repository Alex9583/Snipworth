import { z } from 'zod';
import { errorResponseSchema } from '../shared';

export const LOAD_CODE_BOUNDS = {
  maxCodeChars: 1_000_000,
  maxUrlChars: 2048,
  maxLanguageChars: 64,
} as const;

export const loadCodeRequestSchema = z.strictObject({
  type: z.literal('LOAD_CODE'),
  code: z.string().max(LOAD_CODE_BOUNDS.maxCodeChars),
  sourceUrl: z.url().max(LOAD_CODE_BOUNDS.maxUrlChars).optional(),
  language: z.string().max(LOAD_CODE_BOUNDS.maxLanguageChars).optional(),
});

export type LoadCodeRequest = z.infer<typeof loadCodeRequestSchema>;

export const loadCodeResponseSchema = z.discriminatedUnion('ok', [
  z.strictObject({ ok: z.literal(true) }),
  errorResponseSchema,
]);
