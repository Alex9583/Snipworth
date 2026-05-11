import type { DetectionOutcome } from '@/application/ports/LanguageDetector';

export type DetectedLanguageStatus =
  | { readonly kind: 'auto-detected' }
  | { readonly kind: 'fallback'; readonly cause: unknown };

export interface DetectedLanguage {
  readonly language: string;
  readonly detection: DetectedLanguageStatus;
}

const PLAINTEXT = 'plaintext';

export function translateDetection(outcome: DetectionOutcome): DetectedLanguage {
  if (outcome.kind === 'detected') {
    return {
      language: outcome.result.language,
      detection: { kind: 'auto-detected' },
    };
  }
  return {
    language: PLAINTEXT,
    detection: { kind: 'fallback', cause: outcome.cause },
  };
}
