import { describe, expect, it } from 'vitest';

import { backgroundCss } from '@/adapters/primary/app/previewBackground';

describe('backgroundCss', () => {
  it('should_return_the_color_when_background_is_solid', () => {
    expect(backgroundCss({ type: 'solid', color: '#0F172A' })).toBe('#0F172A');
  });

  it('should_return_a_linear_gradient_when_background_is_gradient', () => {
    expect(backgroundCss({ type: 'gradient', from: '#000', to: '#fff', angle: 135 })).toBe(
      'linear-gradient(135deg, #000, #fff)',
    );
  });

  it('should_return_transparent_when_background_is_transparent', () => {
    expect(backgroundCss({ type: 'transparent' })).toBe('transparent');
  });
});
