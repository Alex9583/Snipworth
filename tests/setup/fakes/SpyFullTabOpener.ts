import type { FullTabOpener, OpenFullTabOutcome } from '@/application/ports/FullTabOpener';

export class SpyFullTabOpener implements FullTabOpener {
  readonly calls: number[] = [];

  constructor(private readonly outcome: OpenFullTabOutcome) {}

  openFullTab(): Promise<OpenFullTabOutcome> {
    this.calls.push(this.calls.length + 1);
    return Promise.resolve(this.outcome);
  }
}
