import type { DetectionResult } from '@/domain/language-detection/DetectionResult';

export type DetectionOutcome =
  | { readonly kind: 'detected'; readonly result: DetectionResult }
  | { readonly kind: 'detection_failed'; readonly cause: unknown };

export interface LanguageDetector {
  detect(code: string): DetectionOutcome;
}
