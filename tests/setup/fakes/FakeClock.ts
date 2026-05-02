import type { Clock } from '@/application/ports/Clock';

const DEFAULT_INSTANT = '2026-01-01T00:00:00.000Z';

export class FakeClock implements Clock {
  private current: Date;

  constructor(initial: Date = new Date(DEFAULT_INSTANT)) {
    this.current = new Date(initial);
  }

  now(): Date {
    return new Date(this.current);
  }

  set(date: Date): void {
    this.current = new Date(date);
  }

  advanceMs(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}
