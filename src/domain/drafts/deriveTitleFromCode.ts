import { TITLE_MAX } from '@/domain/limits';

const TITLE_FALLBACK = 'Untitled';
const TITLE_TRUNCATION_SUFFIX = '…';

export function deriveTitleFromCode(code: string): string {
  const firstNonBlank = code.split('\n').find((line) => line.trim().length > 0);
  if (firstNonBlank === undefined) {
    return TITLE_FALLBACK;
  }
  const trimmed = firstNonBlank.trim();
  if (trimmed.length > TITLE_MAX) {
    return trimmed.slice(0, TITLE_MAX - TITLE_TRUNCATION_SUFFIX.length) + TITLE_TRUNCATION_SUFFIX;
  }
  return trimmed;
}
