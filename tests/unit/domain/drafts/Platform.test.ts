import { describe, it, expect } from 'vitest';
import { isPlatform, platforms, type Platform } from '@/domain/drafts/Platform';

describe('platforms', () => {
  it('should_expose_the_six_platforms_supported_by_the_mvp', () => {
    expect(new Set(platforms)).toEqual(
      new Set(['x', 'linkedin', 'instagram', 'instagram-story', 'thread', 'generic']),
    );
    expect(platforms).toHaveLength(6);
  });
});

describe('isPlatform', () => {
  it.each(['x', 'linkedin', 'instagram', 'instagram-story', 'thread', 'generic'])(
    'should_recognize_%s_as_a_platform',
    (value) => {
      expect(isPlatform(value)).toBe(true);
    },
  );

  it('should_reject_an_unknown_string_as_a_platform', () => {
    expect(isPlatform('mastodon')).toBe(false);
  });

  it('should_reject_an_empty_string_as_a_platform', () => {
    expect(isPlatform('')).toBe(false);
  });

  it('should_reject_a_non_string_value_as_a_platform', () => {
    expect(isPlatform(42)).toBe(false);
    expect(isPlatform(null)).toBe(false);
    expect(isPlatform(undefined)).toBe(false);
  });

  it('should_narrow_the_type_to_Platform_when_true', () => {
    const value: unknown = 'linkedin';
    if (isPlatform(value)) {
      const narrowed: Platform = value;
      expect(narrowed).toBe('linkedin');
    } else {
      throw new Error('expected isPlatform to return true');
    }
  });
});
