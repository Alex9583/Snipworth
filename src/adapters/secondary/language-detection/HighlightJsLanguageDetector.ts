import defaultHljs from 'highlight.js/lib/common';

import type { DetectionOutcome, LanguageDetector } from '@/application/ports/LanguageDetector';

export interface HighlightAutoLike {
  readonly highlightAuto: (code: string) => { language?: string; relevance: number };
}

export class HighlightJsLanguageDetector implements LanguageDetector {
  constructor(private readonly hljs: HighlightAutoLike = defaultHljs) {}

  detect(code: string): DetectionOutcome {
    try {
      const result = this.hljs.highlightAuto(code);
      return {
        kind: 'detected',
        result: {
          language: result.language ?? 'plaintext',
          relevance: result.relevance,
        },
      };
    } catch (cause) {
      return { kind: 'detection_failed', cause };
    }
  }
}
