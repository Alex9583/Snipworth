import { z } from 'zod';
import { errorResponseSchema } from './shared';
import {
  ackErrorsRequestSchema,
  ackErrorsResponseSchema,
  type AckErrorsRequest,
} from './variants/ack-errors';
import {
  loadCodeRequestSchema,
  loadCodeResponseSchema,
  type LoadCodeRequest,
} from './variants/load-code';
import { pingRequestSchema, pingResponseSchema, type PingRequest } from './variants/ping';

const messageVariantSchema = z.discriminatedUnion('type', [
  pingRequestSchema,
  loadCodeRequestSchema,
  ackErrorsRequestSchema,
]);

const stripPrototype = (value: unknown): unknown =>
  typeof value === 'object' && value !== null ? { ...value } : value;

export const extensionMessageSchema = z.preprocess(stripPrototype, messageVariantSchema);

export type ExtensionMessage = z.infer<typeof messageVariantSchema>;
export type { PingRequest, LoadCodeRequest, AckErrorsRequest };

const backgroundInboundVariantSchema = z.discriminatedUnion('type', [
  pingRequestSchema,
  ackErrorsRequestSchema,
]);

export const backgroundInboundSchema = z.preprocess(stripPrototype, backgroundInboundVariantSchema);

export type BackgroundInboundMessage = z.infer<typeof backgroundInboundVariantSchema>;

export const responseSchemaFor = {
  PING: pingResponseSchema,
  LOAD_CODE: loadCodeResponseSchema,
  ACK_ERRORS: ackErrorsResponseSchema,
} as const satisfies Record<ExtensionMessage['type'], z.ZodType>;

export type ResponseFor<M extends ExtensionMessage> = z.infer<
  (typeof responseSchemaFor)[M['type']]
>;

export const extensionResponseSchema = z.discriminatedUnion('ok', [
  z.strictObject({ ok: z.literal(true), data: z.unknown().optional() }),
  errorResponseSchema,
]);

export type ExtensionResponse = z.infer<typeof extensionResponseSchema>;
