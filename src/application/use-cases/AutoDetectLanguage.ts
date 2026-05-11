import type { LanguageDetector } from '@/application/ports/LanguageDetector';

import {
  type DetectedLanguage,
  translateDetection,
} from '@/application/language-detection/translateDetection';

export class AutoDetectLanguage {
  constructor(private readonly detector: LanguageDetector) {}

  execute(code: string): DetectedLanguage {
    return translateDetection(this.detector.detect(code));
  }
}
