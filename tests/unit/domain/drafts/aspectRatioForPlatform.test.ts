import { describe, it, expect } from 'vitest';
import { aspectRatioForPlatform } from '@/domain/drafts/aspectRatioForPlatform';

describe('aspectRatioForPlatform', () => {
  it('should_return_16_9_when_platform_is_x', () => {
    expect(aspectRatioForPlatform('x')).toBe('16:9');
  });

  it('should_return_16_9_when_platform_is_linkedin', () => {
    expect(aspectRatioForPlatform('linkedin')).toBe('16:9');
  });

  it('should_return_1_1_when_platform_is_instagram', () => {
    expect(aspectRatioForPlatform('instagram')).toBe('1:1');
  });

  it('should_return_9_16_when_platform_is_instagram_story', () => {
    expect(aspectRatioForPlatform('instagram-story')).toBe('9:16');
  });

  it('should_return_4_5_when_platform_is_thread', () => {
    expect(aspectRatioForPlatform('thread')).toBe('4:5');
  });

  it('should_return_auto_when_platform_is_generic', () => {
    expect(aspectRatioForPlatform('generic')).toBe('auto');
  });
});
