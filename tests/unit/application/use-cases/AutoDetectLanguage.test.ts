import { describe, expect, it } from 'vitest';

import { AutoDetectLanguage } from '@/application/use-cases/AutoDetectLanguage';

import { StubLanguageDetector } from '../../../setup/fakes/StubLanguageDetector';

describe('AutoDetectLanguage', () => {
  it('should_return_the_detected_language_with_an_auto_detected_status_when_detection_succeeds', () => {
    const useCase = new AutoDetectLanguage(
      new StubLanguageDetector({
        kind: 'detected',
        result: { language: 'typescript', relevance: 12 },
      }),
    );

    const result = useCase.execute('const x: number = 1;');

    expect(result).toEqual({
      language: 'typescript',
      detection: { kind: 'auto-detected' },
    });
  });

  it('should_fall_back_to_plaintext_with_the_cause_when_detection_fails', () => {
    const cause = new Error('boom');
    const useCase = new AutoDetectLanguage(
      new StubLanguageDetector({ kind: 'detection_failed', cause }),
    );

    const result = useCase.execute('a');

    expect(result).toEqual({
      language: 'plaintext',
      detection: { kind: 'fallback', cause },
    });
  });

  it('should_forward_the_input_code_to_the_detector', () => {
    const seen: string[] = [];
    const detector = new StubLanguageDetector({
      kind: 'detected',
      result: { language: 'rust', relevance: 7 },
    });
    const detectorSpy = {
      detect(code: string) {
        seen.push(code);
        return detector.detect();
      },
    };
    const useCase = new AutoDetectLanguage(detectorSpy);

    useCase.execute('fn main() {}');

    expect(seen).toEqual(['fn main() {}']);
  });
});
