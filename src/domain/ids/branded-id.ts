import { type InvariantViolation, requireMaxLength, requireNonEmpty } from '@/domain/invariants';
import { ID_MAX } from '@/domain/limits';

export function parseBrandedId<B extends string>(
  raw: string,
  fail: InvariantViolation,
  field = 'id',
): B {
  requireNonEmpty(raw, field, fail);
  requireMaxLength(raw, ID_MAX, field, fail);
  return raw as unknown as B;
}
