import type { InvariantViolation } from '@/domain/invariants';
import { parseBrandedId } from '@/domain/ids/branded-id';

declare const reportIdBrand: unique symbol;
export type ReportId = string & { readonly [reportIdBrand]: true };

export const ReportId = {
  from(raw: string, fail: InvariantViolation, field = 'id'): ReportId {
    return parseBrandedId<ReportId>(raw, fail, field);
  },
} as const;
