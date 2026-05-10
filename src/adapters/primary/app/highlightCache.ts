import type { HighlightedCode, SyntaxHighlighter } from '@/application/ports/SyntaxHighlighter';

export type HighlightLookup = (
  code: string,
  language: string,
  theme: string,
) => Promise<HighlightedCode>;

export interface HighlightCacheOptions {
  readonly capacity?: number;
}

const DEFAULT_CAPACITY = 64;

export function createHighlightCache(
  highlighter: SyntaxHighlighter,
  options: HighlightCacheOptions = {},
): HighlightLookup {
  const capacity = options.capacity ?? DEFAULT_CAPACITY;
  const cache = new Map<string, Promise<HighlightedCode>>();

  return (code, language, theme) => {
    const key = JSON.stringify([language, theme, code]);
    const existing = cache.get(key);
    if (existing !== undefined) {
      cache.delete(key);
      cache.set(key, existing);
      return existing;
    }
    if (cache.size >= capacity) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey !== undefined) cache.delete(oldestKey);
    }
    const pending = highlighter.highlight(code, language, theme);
    cache.set(key, pending);
    return pending;
  };
}
