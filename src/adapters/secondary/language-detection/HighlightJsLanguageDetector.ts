import hljs from 'highlight.js/lib/common';

import type { LanguageDetector } from '@/application/ports/LanguageDetector';
import type { DetectionResult } from '@/domain/language-detection/DetectionResult';

export class HighlightJsLanguageDetector implements LanguageDetector {
  detect(code: string): DetectionResult {
    const result = hljs.highlightAuto(code);
    return {
      language: result.language ?? 'plaintext',
      relevance: result.relevance,
    };
  }
}
