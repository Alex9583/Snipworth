import { z } from 'zod';
import {
  errorKinds,
  errorSeverities,
  errorSources,
  type ErrorReportSnapshot,
} from '@/domain/error-reporting/ErrorReport';

export const PENDING_ERRORS_KEY = 'pending_errors';
export const MAX_QUEUED_REPORTS = 50;
export const MAX_DETAILS_BYTES = 1000;

export const errorReportSnapshotSchema: z.ZodType<ErrorReportSnapshot> = z.strictObject({
  id: z.string().min(1),
  kind: z.enum(errorKinds),
  message: z.string().min(1),
  occurredAt: z.iso.datetime(),
  source: z.enum(errorSources),
  severity: z.enum(errorSeverities),
  details: z.string().max(MAX_DETAILS_BYTES).optional(),
});

export const pendingErrorsSchema = z.array(errorReportSnapshotSchema).max(MAX_QUEUED_REPORTS);
