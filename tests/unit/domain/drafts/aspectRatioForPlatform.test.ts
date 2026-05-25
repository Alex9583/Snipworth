import { describe, it, expect } from 'vitest';
import { aspectRatioForPlatform } from '@/domain/drafts/aspectRatioForPlatform';

describe('aspectRatioForPlatform', () => {
  it('should_return_fixed_16_9_when_platform_is_x', () => {
    expect(aspectRatioForPlatform('x')).toEqual({ kind: 'fixed', ratio: '16:9' });
  });

  it('should_return_fixed_1_91_1_when_platform_is_linkedin', () => {
    expect(aspectRatioForPlatform('linkedin')).toEqual({ kind: 'fixed', ratio: '1.91:1' });
  });

  it('should_return_fixed_1_1_when_platform_is_instagram', () => {
    expect(aspectRatioForPlatform('instagram')).toEqual({ kind: 'fixed', ratio: '1:1' });
  });

  it('should_return_fixed_9_16_when_platform_is_instagram_story', () => {
    expect(aspectRatioForPlatform('instagram-story')).toEqual({ kind: 'fixed', ratio: '9:16' });
  });

  it('should_return_fixed_4_5_when_platform_is_thread', () => {
    expect(aspectRatioForPlatform('thread')).toEqual({ kind: 'fixed', ratio: '4:5' });
  });

  it('should_return_auto_when_platform_is_generic', () => {
    expect(aspectRatioForPlatform('generic')).toEqual({ kind: 'auto' });
  });
});
