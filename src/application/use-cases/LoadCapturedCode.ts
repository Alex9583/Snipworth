import {
  type DetectedLanguageStatus,
  translateDetection,
} from '@/application/language-detection/translateDetection';
import type { LanguageDetector } from '@/application/ports/LanguageDetector';
import type { CapturedSelection } from '@/domain/capture/CapturedSelection';

export type DetectionStatus =
  | DetectedLanguageStatus
  | { readonly kind: 'manual' }
  | { readonly kind: 'idle' };

export interface LoadedCode {
  readonly code: string;
  readonly language: string;
  readonly sourceUrl: string | undefined;
  readonly detection: DetectedLanguageStatus;
}

export class LoadCapturedCode {
  constructor(private readonly detector: LanguageDetector) {}

  execute(captured: CapturedSelection): LoadedCode {
    const detected = translateDetection(this.detector.detect(captured.code));
    return {
      code: captured.code,
      language: detected.language,
      sourceUrl: captured.sourceUrl,
      detection: detected.detection,
    };
  }
}
