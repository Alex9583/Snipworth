import { useCallback, useState } from 'react';

import type { DraftSnapshot } from '@/domain/drafts/Draft';
import type { Platform } from '@/domain/drafts/Platform';

export interface UseEditorSessionInput {
  readonly initialPlatform: Platform;
}

export interface EditorSessionHandle {
  readonly platform: Platform;
  readonly caption: string;
  readonly hashtags: readonly string[];
  readonly setPlatform: (next: Platform) => void;
  readonly setCaption: (next: string) => void;
  readonly setHashtags: (next: readonly string[]) => void;
  readonly applySnapshot: (snapshot: DraftSnapshot) => void;
  readonly resetToDefault: (nextPlatform: Platform) => void;
}

export function useEditorSession(input: UseEditorSessionInput): EditorSessionHandle {
  const [platform, setPlatform] = useState<Platform>(input.initialPlatform);
  const [caption, setCaption] = useState<string>('');
  const [hashtags, setHashtags] = useState<readonly string[]>([]);

  const applySnapshot = useCallback((snapshot: DraftSnapshot): void => {
    setPlatform(snapshot.platform);
    setCaption(snapshot.caption);
    setHashtags(snapshot.hashtags);
  }, []);

  const resetToDefault = useCallback((nextPlatform: Platform): void => {
    setPlatform(nextPlatform);
    setCaption('');
    setHashtags([]);
  }, []);

  return {
    platform,
    caption,
    hashtags,
    setPlatform,
    setCaption,
    setHashtags,
    applySnapshot,
    resetToDefault,
  };
}
