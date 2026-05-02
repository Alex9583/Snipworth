import { z } from 'zod';

export const errorResponseSchema = z.strictObject({
  ok: z.literal(false),
  error: z.string(),
});
