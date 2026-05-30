import type { CodeFormatter, FormatOutcome } from '@/application/ports/CodeFormatter';

interface StubConfig {
  readonly supports: boolean;
  readonly outcome: FormatOutcome;
}

export class StubCodeFormatter implements CodeFormatter {
  formatCallCount = 0;

  constructor(private readonly config: StubConfig) {}

  supports(): boolean {
    return this.config.supports;
  }

  format(): Promise<FormatOutcome> {
    this.formatCallCount += 1;
    return Promise.resolve(this.config.outcome);
  }
}
