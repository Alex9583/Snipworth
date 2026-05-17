import type { InvariantViolation } from '@/domain/invariants';
import { parseBrandedId } from '@/domain/ids/branded-id';

declare const draftIdBrand: unique symbol;
export type DraftId = string & { readonly [draftIdBrand]: true };

export const DraftId = {
  from(raw: string, fail: InvariantViolation, field = 'id'): DraftId {
    return parseBrandedId<DraftId>(raw, fail, field);
  },
} as const;
