import { describe, it, expect } from 'vitest';

import { platformDisplayLabel } from '@/adapters/primary/library/platformLabels';

describe('platformDisplayLabel', () => {
  it('should_return_X_when_platform_is_x', () => {
    expect(platformDisplayLabel('x')).toBe('X');
  });

  it('should_return_LinkedIn_when_platform_is_linkedin', () => {
    expect(platformDisplayLabel('linkedin')).toBe('LinkedIn');
  });

  it('should_return_Instagram_when_platform_is_instagram', () => {
    expect(platformDisplayLabel('instagram')).toBe('Instagram');
  });

  it('should_return_Story_when_platform_is_instagram_story', () => {
    expect(platformDisplayLabel('instagram-story')).toBe('Story');
  });

  it('should_return_Thread_when_platform_is_thread', () => {
    expect(platformDisplayLabel('thread')).toBe('Thread');
  });

  it('should_return_Free_when_platform_is_generic', () => {
    expect(platformDisplayLabel('generic')).toBe('Free');
  });
});
