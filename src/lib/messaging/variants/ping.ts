import { z } from 'zod';
import { errorResponseSchema } from '../shared';

export const pingRequestSchema = z.strictObject({
  type: z.literal('PING'),
});

export type PingRequest = z.infer<typeof pingRequestSchema>;

export const pingResponseSchema = z.discriminatedUnion('ok', [
  z.strictObject({ ok: z.literal(true), data: z.literal('pong') }),
  errorResponseSchema,
]);

export type PingResponse = z.infer<typeof pingResponseSchema>;
