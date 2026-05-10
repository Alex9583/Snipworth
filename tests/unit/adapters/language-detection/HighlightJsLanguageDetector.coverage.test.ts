import hljs from 'highlight.js/lib/common';
import { describe, expect, it } from 'vitest';

import {
  LANGUAGE_ALIASES,
  SUPPORTED_LANGUAGES,
} from '@/domain/syntax-highlighting/SupportedLanguages';

const SHIKI_PLAIN_LANGS = ['plaintext', 'text', 'txt'] as const;

describe('HighlightJsLanguageDetector coverage', () => {
  it('should_cover_every_language_the_detector_can_produce', () => {
    const canonical = new Set<string>(SUPPORTED_LANGUAGES);
    const aliases = new Set<string>(Object.keys(LANGUAGE_ALIASES));
    const plain = new Set<string>(SHIKI_PLAIN_LANGS);

    const uncovered = hljs
      .listLanguages()
      .filter((lang) => !canonical.has(lang) && !aliases.has(lang) && !plain.has(lang));

    expect(uncovered).toEqual([]);
  });
});
