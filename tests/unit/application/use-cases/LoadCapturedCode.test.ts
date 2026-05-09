import { describe, it, expect } from 'vitest';
import { LoadCapturedCode } from '@/application/use-cases/LoadCapturedCode';
import type { DetectionOutcome, LanguageDetector } from '@/application/ports/LanguageDetector';
import { CapturedSelection } from '@/domain/capture/CapturedSelection';

class StubDetector implements LanguageDetector {
  constructor(private readonly outcome: DetectionOutcome) {}
  detect(): DetectionOutcome {
    return this.outcome;
  }
}

class CapturingDetector implements LanguageDetector {
  readonly seen: string[] = [];
  constructor(private readonly outcome: DetectionOutcome) {}
  detect(code: string): DetectionOutcome {
    this.seen.push(code);
    return this.outcome;
  }
}

describe('LoadCapturedCode', () => {
  it('should_return_the_detected_language_with_a_detected_status_when_detection_succeeds', () => {
    const useCase = new LoadCapturedCode(
      new StubDetector({
        kind: 'detected',
        result: { language: 'typescript', relevance: 12 },
      }),
    );

    const result = useCase.execute(
      CapturedSelection.from({
        code: 'const x: number = 1;',
        sourceUrl: 'https://example.com/x',
      }),
    );

    expect(result).toEqual({
      code: 'const x: number = 1;',
      language: 'typescript',
      sourceUrl: 'https://example.com/x',
      detection: { kind: 'detected' },
    });
  });

  it('should_fall_back_to_plaintext_when_detection_fails', () => {
    const useCase = new LoadCapturedCode(
      new StubDetector({ kind: 'detection_failed', cause: new Error('boom') }),
    );

    const result = useCase.execute(CapturedSelection.from({ code: 'a', sourceUrl: undefined }));

    expect(result.language).toBe('plaintext');
  });

  it('should_carry_a_fallback_detection_status_with_the_cause_when_detection_fails', () => {
    const cause = new Error('boom');
    const useCase = new LoadCapturedCode(new StubDetector({ kind: 'detection_failed', cause }));

    const result = useCase.execute(CapturedSelection.from({ code: 'a', sourceUrl: undefined }));

    expect(result.detection).toEqual({ kind: 'fallback', cause });
  });

  it('should_preserve_an_undefined_source_url_in_the_loaded_dto', () => {
    const useCase = new LoadCapturedCode(
      new StubDetector({
        kind: 'detected',
        result: { language: 'python', relevance: 9 },
      }),
    );

    const result = useCase.execute(
      CapturedSelection.from({ code: 'print(1)', sourceUrl: undefined }),
    );

    expect(result.sourceUrl).toBeUndefined();
  });

  it('should_pass_the_captured_code_to_the_detector', () => {
    const detector = new CapturingDetector({
      kind: 'detected',
      result: { language: 'rust', relevance: 7 },
    });
    const useCase = new LoadCapturedCode(detector);

    useCase.execute(CapturedSelection.from({ code: 'fn main() {}', sourceUrl: undefined }));

    expect(detector.seen).toEqual(['fn main() {}']);
  });
});
