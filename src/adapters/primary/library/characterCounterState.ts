export type CharacterCounterState = 'ok' | 'warning' | 'error';

/**
 * UX threshold for the character counter.
 *
 * - `< 80%` of the limit → `ok`
 * - `[80%, 100%]` of the limit (inclusive) → `warning`
 * - `> 100%` (strictly greater than the limit) → `error`
 *
 * Note that this is a presentation-only signal — exceeding the platform's
 * char limit is NOT a domain invariant (the platform itself decides what
 * happens at post time). The `Draft` aggregate's own `CAPTION_MAX` is a
 * separate, stricter contract enforced at save time.
 */
export function characterCounterState(used: number, limit: number): CharacterCounterState {
  if (used > limit) return 'error';
  if (used >= limit * 0.8) return 'warning';
  return 'ok';
}
