import { describe, expect, it } from 'vitest';

import { solidBackgroundCss } from '@/adapters/primary/app/previewBackground';

describe('solidBackgroundCss', () => {
  it('should_return_the_color_when_background_is_solid', () => {
    expect(solidBackgroundCss({ type: 'solid', color: '#0F172A' })).toBe('#0F172A');
  });
});
