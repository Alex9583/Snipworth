import { describe, expect, it } from 'vitest';

import { characterCounterState } from '@/adapters/primary/library/characterCounterState';

describe('characterCounterState', () => {
  it('should_return_ok_when_usage_is_zero', () => {
    expect(characterCounterState(0, 280)).toBe('ok');
  });

  it('should_return_ok_when_usage_is_just_below_80_percent', () => {
    expect(characterCounterState(223, 280)).toBe('ok');
  });

  it('should_return_warning_when_usage_is_exactly_80_percent', () => {
    expect(characterCounterState(224, 280)).toBe('warning');
  });

  it('should_return_warning_when_usage_equals_the_limit', () => {
    expect(characterCounterState(280, 280)).toBe('warning');
  });

  it('should_return_error_when_usage_is_strictly_above_the_limit', () => {
    expect(characterCounterState(281, 280)).toBe('error');
  });
});
