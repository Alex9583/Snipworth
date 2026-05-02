import type { IdGenerator } from '@/application/ports/IdGenerator';

export class RandomUuidGenerator implements IdGenerator {
  next(): string {
    return crypto.randomUUID();
  }
}
