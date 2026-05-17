import type { IdGenerator } from '@/application/ports/IdGenerator';

export class FixedIdGenerator implements IdGenerator {
  private cursor = 0;

  constructor(private readonly prefix = 'id') {}

  next(): string {
    this.cursor += 1;
    return `${this.prefix}-${String(this.cursor)}`;
  }

  get consumedCount(): number {
    return this.cursor;
  }
}
