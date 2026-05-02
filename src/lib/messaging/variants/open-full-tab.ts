import { z } from 'zod';
import { errorResponseSchema } from '../shared';

export const openFullTabRequestSchema = z.strictObject({
  type: z.literal('OPEN_FULL_TAB'),
});

export type OpenFullTabRequest = z.infer<typeof openFullTabRequestSchema>;

export const openFullTabResponseSchema = z.discriminatedUnion('ok', [
  z.strictObject({ ok: z.literal(true) }),
  errorResponseSchema,
]);

export type OpenFullTabResponse = z.infer<typeof openFullTabResponseSchema>;
