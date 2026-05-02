import { z } from 'zod';
import { errorResponseSchema } from '../shared';

export const ackErrorsRequestSchema = z.strictObject({
  type: z.literal('ACK_ERRORS'),
  acknowledgedIds: z.array(z.string().min(1)).max(1000),
});

export type AckErrorsRequest = z.infer<typeof ackErrorsRequestSchema>;

export const ackErrorsResponseSchema = z.discriminatedUnion('ok', [
  z.strictObject({ ok: z.literal(true) }),
  errorResponseSchema,
]);

export type AckErrorsResponse = z.infer<typeof ackErrorsResponseSchema>;
