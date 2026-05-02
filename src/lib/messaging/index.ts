import { z } from 'zod';
import { errorResponseSchema } from './shared';
import {
  loadCodeRequestSchema,
  loadCodeResponseSchema,
  type LoadCodeRequest,
} from './variants/load-code';
import {
  openFullTabRequestSchema,
  openFullTabResponseSchema,
  type OpenFullTabRequest,
} from './variants/open-full-tab';
import { pingRequestSchema, pingResponseSchema, type PingRequest } from './variants/ping';

const messageVariantSchema = z.discriminatedUnion('type', [
  pingRequestSchema,
  openFullTabRequestSchema,
  loadCodeRequestSchema,
]);

export const extensionMessageSchema = z.preprocess(
  (value) => (typeof value === 'object' && value !== null ? { ...value } : value),
  messageVariantSchema,
);

export type ExtensionMessage = z.infer<typeof messageVariantSchema>;
export type { PingRequest, OpenFullTabRequest, LoadCodeRequest };

export const responseSchemaFor = {
  PING: pingResponseSchema,
  OPEN_FULL_TAB: openFullTabResponseSchema,
  LOAD_CODE: loadCodeResponseSchema,
} as const satisfies Record<ExtensionMessage['type'], z.ZodType>;

export type ResponseFor<M extends ExtensionMessage> = z.infer<
  (typeof responseSchemaFor)[M['type']]
>;

export const extensionResponseSchema = z.discriminatedUnion('ok', [
  z.strictObject({ ok: z.literal(true), data: z.unknown().optional() }),
  errorResponseSchema,
]);

export type ExtensionResponse = z.infer<typeof extensionResponseSchema>;
