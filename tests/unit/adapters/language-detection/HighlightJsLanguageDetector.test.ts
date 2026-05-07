import { describe, it, expect, vi } from 'vitest';

import { HighlightJsLanguageDetector } from '@/adapters/secondary/language-detection/HighlightJsLanguageDetector';

interface HljsLike {
  readonly highlightAuto: (code: string) => { language?: string; relevance: number };
}

describe('HighlightJsLanguageDetector', () => {
  it('should_detect_typescript_when_code_uses_typescript_syntax', () => {
    const detector = new HighlightJsLanguageDetector();

    const outcome = detector.detect(
      'export function sum(a: number, b: number): number { return a + b; }',
    );

    expect(outcome.kind).toBe('detected');
    if (outcome.kind !== 'detected') return;
    expect(outcome.result.language).toBe('typescript');
  });

  it('should_detect_python_when_code_uses_python_syntax', () => {
    const detector = new HighlightJsLanguageDetector();

    const outcome = detector.detect('def greet(name):\n    print(f"Hello {name}")');

    expect(outcome.kind).toBe('detected');
    if (outcome.kind !== 'detected') return;
    expect(outcome.result.language).toBe('python');
  });

  it('should_return_detected_plaintext_with_zero_relevance_when_code_is_empty', () => {
    const detector = new HighlightJsLanguageDetector();

    const outcome = detector.detect('');

    expect(outcome).toEqual({
      kind: 'detected',
      result: { language: 'plaintext', relevance: 0 },
    });
  });

  it('should_return_detected_plaintext_with_zero_relevance_when_code_is_only_whitespace', () => {
    const detector = new HighlightJsLanguageDetector();

    const outcome = detector.detect('   \n\t  ');

    expect(outcome).toEqual({
      kind: 'detected',
      result: { language: 'plaintext', relevance: 0 },
    });
  });

  it('should_expose_positive_relevance_when_language_is_clearly_detected', () => {
    const detector = new HighlightJsLanguageDetector();

    const outcome = detector.detect(
      'function fibonacci(n) { return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2); }',
    );

    expect(outcome.kind).toBe('detected');
    if (outcome.kind !== 'detected') return;
    expect(outcome.result.relevance).toBeGreaterThan(0);
  });

  it('should_return_detection_failed_when_hljs_throws', () => {
    const cause = new Error('hljs blew up on pathological input');
    const hljsStub: HljsLike = {
      highlightAuto: vi.fn(() => {
        throw cause;
      }),
    };
    const detector = new HighlightJsLanguageDetector(hljsStub);

    const outcome = detector.detect('// any code');

    expect(outcome).toEqual({ kind: 'detection_failed', cause });
  });
});
