import type { LanguageDetector } from '@/application/ports/LanguageDetector';
import type { CapturedSelection } from '@/domain/capture/CapturedSelection';

const PLAINTEXT_FALLBACK = 'plaintext';

export type DetectionStatus =
  | { readonly kind: 'detected' }
  | { readonly kind: 'fallback'; readonly cause: unknown };

export interface LoadedCode {
  readonly code: string;
  readonly language: string;
  readonly sourceUrl: string | undefined;
  readonly detection: DetectionStatus;
}

export class LoadCapturedCode {
  constructor(private readonly detector: LanguageDetector) {}

  execute(captured: CapturedSelection): LoadedCode {
    const outcome = this.detector.detect(captured.code);
    if (outcome.kind === 'detected') {
      return {
        code: captured.code,
        language: outcome.result.language,
        sourceUrl: captured.sourceUrl,
        detection: { kind: 'detected' },
      };
    }
    return {
      code: captured.code,
      language: PLAINTEXT_FALLBACK,
      sourceUrl: captured.sourceUrl,
      detection: { kind: 'fallback', cause: outcome.cause },
    };
  }
}
