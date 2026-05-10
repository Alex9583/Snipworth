import { z } from 'zod';
import { errorKinds, errorSeverities, errorSources } from '@/domain/error-reporting/ErrorReport';
import { errorResponseSchema } from '../shared';

export const errorReportSnapshotSchema = z.strictObject({
  id: z.string().min(1),
  kind: z.enum(errorKinds),
  message: z.string().min(1),
  occurredAt: z.string().min(1),
  source: z.enum(errorSources),
  severity: z.enum(errorSeverities),
  details: z.string().optional(),
});

export const reportErrorRequestSchema = z.strictObject({
  type: z.literal('REPORT_ERROR'),
  report: errorReportSnapshotSchema,
});

export type ReportErrorRequest = z.infer<typeof reportErrorRequestSchema>;

export const reportErrorResponseSchema = z.discriminatedUnion('ok', [
  z.strictObject({ ok: z.literal(true) }),
  errorResponseSchema,
]);
