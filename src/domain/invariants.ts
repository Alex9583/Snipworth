export type InvariantViolation = (reason: string) => never;

export function requireNonEmpty(value: string, field: string, fail: InvariantViolation): void {
  if (value.trim().length === 0) fail(`${field} must not be empty`);
}

export function requireMaxLength(
  value: string,
  max: number,
  field: string,
  fail: InvariantViolation,
): void {
  if (value.length > max) fail(`${field} must not exceed ${String(max)} characters`);
}

export function requireFiniteDate(value: Date, field: string, fail: InvariantViolation): void {
  if (!Number.isFinite(value.getTime())) fail(`${field} must be a valid date`);
}
