import { describe, it, expect } from 'vitest';
import { SystemClock } from '@/adapters/secondary/clock/SystemClock';

describe('SystemClock', () => {
  it('should_return_a_Date_close_to_real_time', () => {
    const clock = new SystemClock();

    const before = Date.now();
    const now = clock.now();
    const after = Date.now();

    expect(now).toBeInstanceOf(Date);
    expect(now.getTime()).toBeGreaterThanOrEqual(before);
    expect(now.getTime()).toBeLessThanOrEqual(after);
  });
});
