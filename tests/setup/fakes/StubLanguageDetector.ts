import type { DetectionOutcome, LanguageDetector } from '@/application/ports/LanguageDetector';

export class StubLanguageDetector implements LanguageDetector {
  constructor(private readonly outcome: DetectionOutcome) {}

  detect(): DetectionOutcome {
    return this.outcome;
  }
}
