import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useEditorSession } from '@/adapters/primary/app/useEditorSession';
import type { DraftSnapshot } from '@/domain/drafts/Draft';
import { RenderConfig } from '@/domain/rendering/RenderConfig';

function aSnapshot(overrides: Partial<DraftSnapshot> = {}): DraftSnapshot {
  return {
    id: 'draft-1',
    title: 'Bound draft',
    code: 'const greeting = "hi";',
    language: 'typescript',
    config: RenderConfig.default().toSnapshot(),
    caption: 'A caption',
    hashtags: ['#react', '#typescript'],
    platform: 'linkedin',
    status: 'draft',
    createdAt: 1_000,
    updatedAt: 2_000,
    ...overrides,
  };
}

describe('useEditorSession', () => {
  it('should_initialize_platform_to_the_provided_default_with_an_empty_caption_and_no_hashtags', () => {
    const { result } = renderHook(() => useEditorSession({ initialPlatform: 'x' }));

    expect(result.current.platform).toBe('x');
    expect(result.current.caption).toBe('');
    expect(result.current.hashtags).toEqual([]);
  });

  it('should_update_platform_when_setPlatform_is_invoked', () => {
    const { result } = renderHook(() => useEditorSession({ initialPlatform: 'x' }));

    act(() => {
      result.current.setPlatform('instagram');
    });

    expect(result.current.platform).toBe('instagram');
  });

  it('should_update_caption_when_setCaption_is_invoked', () => {
    const { result } = renderHook(() => useEditorSession({ initialPlatform: 'x' }));

    act(() => {
      result.current.setCaption('Just shipped!');
    });

    expect(result.current.caption).toBe('Just shipped!');
  });

  it('should_update_hashtags_when_setHashtags_is_invoked', () => {
    const { result } = renderHook(() => useEditorSession({ initialPlatform: 'x' }));

    act(() => {
      result.current.setHashtags(['#typescript']);
    });

    expect(result.current.hashtags).toEqual(['#typescript']);
  });

  it('should_replace_all_three_fields_from_the_snapshot_when_applySnapshot_is_invoked', () => {
    const { result } = renderHook(() => useEditorSession({ initialPlatform: 'x' }));
    const snapshot = aSnapshot({
      platform: 'instagram',
      caption: 'New caption',
      hashtags: ['#a', '#b'],
    });

    act(() => {
      result.current.applySnapshot(snapshot);
    });

    expect(result.current.platform).toBe('instagram');
    expect(result.current.caption).toBe('New caption');
    expect(result.current.hashtags).toEqual(['#a', '#b']);
  });

  it('should_reset_platform_to_the_argument_and_clear_caption_and_hashtags_when_resetToDefault_is_invoked', () => {
    const { result } = renderHook(() => useEditorSession({ initialPlatform: 'x' }));
    act(() => {
      result.current.setPlatform('thread');
      result.current.setCaption('drafted');
      result.current.setHashtags(['#go']);
    });

    act(() => {
      result.current.resetToDefault('linkedin');
    });

    expect(result.current.platform).toBe('linkedin');
    expect(result.current.caption).toBe('');
    expect(result.current.hashtags).toEqual([]);
  });
});
