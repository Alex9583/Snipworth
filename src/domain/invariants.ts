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

export function requireTagList(
  values: readonly string[],
  field: string,
  max: number,
  fail: InvariantViolation,
): void {
  if (values.length > max) {
    fail(`${field} must not contain more than ${String(max)} entries`);
  }
  const seen = new Set<string>();
  for (const value of values) {
    if (value.trim().length === 0) fail(`${field} entries must not be empty`);
    if (seen.has(value)) fail(`${field} must not contain duplicates`);
    seen.add(value);
  }
}
