import { describe, it, expect } from 'vitest';

import { HighlightJsLanguageDetector } from '@/adapters/secondary/language-detection/HighlightJsLanguageDetector';

describe('HighlightJsLanguageDetector', () => {
  it('should_detect_typescript_when_code_uses_typescript_syntax', () => {
    const detector = new HighlightJsLanguageDetector();

    const result = detector.detect(
      'export function sum(a: number, b: number): number { return a + b; }',
    );

    expect(result.language).toBe('typescript');
  });

  it('should_detect_python_when_code_uses_python_syntax', () => {
    const detector = new HighlightJsLanguageDetector();

    const result = detector.detect('def greet(name):\n    print(f"Hello {name}")');

    expect(result.language).toBe('python');
  });

  it('should_return_plaintext_with_zero_relevance_when_code_is_empty', () => {
    const detector = new HighlightJsLanguageDetector();

    const result = detector.detect('');

    expect(result).toEqual({ language: 'plaintext', relevance: 0 });
  });

  it('should_return_plaintext_with_zero_relevance_when_code_is_only_whitespace', () => {
    const detector = new HighlightJsLanguageDetector();

    const result = detector.detect('   \n\t  ');

    expect(result).toEqual({ language: 'plaintext', relevance: 0 });
  });

  it('should_expose_positive_relevance_when_language_is_clearly_detected', () => {
    const detector = new HighlightJsLanguageDetector();

    const result = detector.detect(
      'function fibonacci(n) { return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2); }',
    );

    expect(result.relevance).toBeGreaterThan(0);
  });
});
