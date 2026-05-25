import { describe, it, expect } from 'vitest';
import { platformCharLimit } from '@/domain/drafts/platformCharLimit';

describe('platformCharLimit', () => {
  it('should_return_280_when_platform_is_x', () => {
    expect(platformCharLimit('x')).toBe(280);
  });

  it('should_return_3000_when_platform_is_linkedin', () => {
    expect(platformCharLimit('linkedin')).toBe(3000);
  });

  it('should_return_2200_when_platform_is_instagram', () => {
    expect(platformCharLimit('instagram')).toBe(2200);
  });

  it('should_return_null_when_platform_is_instagram_story', () => {
    expect(platformCharLimit('instagram-story')).toBeNull();
  });

  it('should_return_500_when_platform_is_thread', () => {
    expect(platformCharLimit('thread')).toBe(500);
  });

  it('should_return_null_when_platform_is_generic', () => {
    expect(platformCharLimit('generic')).toBeNull();
  });
});
