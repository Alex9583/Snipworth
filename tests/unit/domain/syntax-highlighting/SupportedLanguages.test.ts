import { describe, expect, it } from 'vitest';

import {
  LANGUAGE_ALIASES,
  PICKER_LANGUAGES,
  SUPPORTED_LANGUAGES,
  isSupportedLanguage,
} from '@/domain/syntax-highlighting/SupportedLanguages';

const SHIKI_PLAIN_LANGS = ['plaintext', 'text', 'txt'] as const;

describe('SupportedLanguages', () => {
  it('should_alias_each_non_canonical_name_to_a_supported_language', () => {
    for (const target of Object.values(LANGUAGE_ALIASES)) {
      expect(SUPPORTED_LANGUAGES).toContain(target);
    }
  });

  it('should_offer_picker_languages_that_are_either_supported_or_plain_text', () => {
    const canonical = new Set<string>(SUPPORTED_LANGUAGES);
    const plain = new Set<string>(SHIKI_PLAIN_LANGS);

    const unsupported = PICKER_LANGUAGES.filter((lang) => !canonical.has(lang) && !plain.has(lang));

    expect(unsupported).toEqual([]);
  });

  it('should_recognize_a_canonical_language_as_supported', () => {
    expect(isSupportedLanguage('typescript')).toBe(true);
  });

  it('should_reject_an_unknown_language', () => {
    expect(isSupportedLanguage('not-a-real-language')).toBe(false);
  });
});
