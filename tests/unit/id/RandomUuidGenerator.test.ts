import { describe, it, expect } from 'vitest';
import { RandomUuidGenerator } from '@/adapters/secondary/id/RandomUuidGenerator';

describe('RandomUuidGenerator', () => {
  it('should_return_a_non_empty_string', () => {
    const generator = new RandomUuidGenerator();

    expect(generator.next().length).toBeGreaterThan(0);
  });

  it('should_return_distinct_ids_on_consecutive_calls', () => {
    const generator = new RandomUuidGenerator();

    const a = generator.next();
    const b = generator.next();
    const c = generator.next();

    expect(new Set([a, b, c]).size).toBe(3);
  });
});
