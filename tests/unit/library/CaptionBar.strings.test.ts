import { describe, expect, it } from 'vitest';

import { remainingHint } from '@/adapters/primary/library/CaptionBar.strings';

describe('remainingHint', () => {
  it('should_compose_for_platformLabel_dot_remaining_remaining', () => {
    expect(remainingHint('X', 33)).toBe('for X · 33 remaining');
  });
});
