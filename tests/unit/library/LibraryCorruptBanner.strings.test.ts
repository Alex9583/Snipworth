import { describe, expect, it } from 'vitest';

import { messageWithCount } from '@/adapters/primary/library/LibraryCorruptBanner.strings';

describe('messageWithCount', () => {
  it('should_render_singular_when_count_is_one', () => {
    expect(messageWithCount(1)).toBe('1 draft could not be loaded');
  });

  it('should_render_plural_when_count_is_more_than_one', () => {
    expect(messageWithCount(3)).toBe('3 drafts could not be loaded');
  });
});
