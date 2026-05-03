import type { DetectionResult } from '@/domain/language-detection/DetectionResult';

export interface LanguageDetector {
  detect(code: string): DetectionResult;
}
