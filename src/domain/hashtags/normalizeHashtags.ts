import { HASHTAG_LIST_MAX, HASHTAG_MAX_LENGTH } from '@/domain/limits';

// HASHTAG_MAX_LENGTH counts the leading '#'; the regex body therefore reserves 1 slot for it.
const HASHTAG_BODY_MAX = HASHTAG_MAX_LENGTH - 1;
const HASHTAG_PATTERN = new RegExp(`^#[\\p{L}\\p{N}_]{1,${String(HASHTAG_BODY_MAX)}}$`, 'u');

export type HashtagRejection = (reason: string) => never;

export function normalizeHashtags(
  raw: readonly string[],
  reject: HashtagRejection,
): readonly string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const token of raw) {
    const trimmed = token.trim();
    if (trimmed.length === 0) continue;
    const prefixed = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
    if (!HASHTAG_PATTERN.test(prefixed)) {
      reject(`hashtags must not contain malformed entry "${prefixed}"`);
    }
    const key = prefixed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(prefixed);
  }
  if (result.length > HASHTAG_LIST_MAX) {
    reject(`hashtags must not contain more than ${String(HASHTAG_LIST_MAX)} entries`);
  }
  return result;
}
