import type { InvariantViolation } from '@/domain/invariants';
import { parseBrandedId } from '@/domain/ids/branded-id';

declare const snippetIdBrand: unique symbol;
export type SnippetId = string & { readonly [snippetIdBrand]: true };

export const SnippetId = {
  from(raw: string, fail: InvariantViolation, field = 'id'): SnippetId {
    return parseBrandedId<SnippetId>(raw, fail, field);
  },
} as const;
