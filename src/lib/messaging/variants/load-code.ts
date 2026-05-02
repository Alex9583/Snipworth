import { z } from 'zod';
import { errorResponseSchema } from '../shared';

const MAX_CODE_BYTES = 1_000_000;
const MAX_URL_BYTES = 2048;
const MAX_LANGUAGE_BYTES = 64;

export const loadCodeRequestSchema = z.strictObject({
  type: z.literal('LOAD_CODE'),
  code: z.string().max(MAX_CODE_BYTES),
  sourceUrl: z.url().max(MAX_URL_BYTES).optional(),
  language: z.string().max(MAX_LANGUAGE_BYTES).optional(),
});

export type LoadCodeRequest = z.infer<typeof loadCodeRequestSchema>;

export const loadCodeResponseSchema = z.discriminatedUnion('ok', [
  z.strictObject({ ok: z.literal(true) }),
  errorResponseSchema,
]);

export type LoadCodeResponse = z.infer<typeof loadCodeResponseSchema>;
