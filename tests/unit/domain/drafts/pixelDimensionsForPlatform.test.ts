import { describe, it, expect } from 'vitest';

import { pixelDimensionsForPlatform } from '@/domain/drafts/pixelDimensionsForPlatform';

describe('pixelDimensionsForPlatform', () => {
  it('should_return_fixed_1200_675_when_platform_is_x', () => {
    expect(pixelDimensionsForPlatform('x')).toEqual({
      kind: 'fixed',
      width: 1200,
      height: 675,
    });
  });

  it('should_return_fixed_1200_628_when_platform_is_linkedin', () => {
    expect(pixelDimensionsForPlatform('linkedin')).toEqual({
      kind: 'fixed',
      width: 1200,
      height: 628,
    });
  });

  it('should_return_fixed_1080_1080_when_platform_is_instagram', () => {
    expect(pixelDimensionsForPlatform('instagram')).toEqual({
      kind: 'fixed',
      width: 1080,
      height: 1080,
    });
  });

  it('should_return_fixed_1080_1920_when_platform_is_instagram_story', () => {
    expect(pixelDimensionsForPlatform('instagram-story')).toEqual({
      kind: 'fixed',
      width: 1080,
      height: 1920,
    });
  });

  it('should_return_fixed_1080_1350_when_platform_is_thread', () => {
    expect(pixelDimensionsForPlatform('thread')).toEqual({
      kind: 'fixed',
      width: 1080,
      height: 1350,
    });
  });

  it('should_return_auto_when_platform_is_generic', () => {
    expect(pixelDimensionsForPlatform('generic')).toEqual({ kind: 'auto' });
  });
});
