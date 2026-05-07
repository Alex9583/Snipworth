import { z } from 'zod';
import { backgroundFailureCodes } from '@/application/ports/BackgroundFailure';

export const wireFailureCodes = ['inbox_unavailable', ...backgroundFailureCodes] as const;

export const errorResponseSchema = z.strictObject({
  ok: z.literal(false),
  error: z.strictObject({
    code: z.enum(wireFailureCodes),
    message: z.string(),
  }),
});
