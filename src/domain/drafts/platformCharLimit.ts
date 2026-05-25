import type { Platform } from '@/domain/drafts/Platform';

const CHAR_LIMIT_BY_PLATFORM: Record<Platform, number | null> = {
  'x': 280,
  'linkedin': 3000,
  'instagram': 2200,
  'instagram-story': null,
  'thread': 500,
  'generic': null,
};

export function platformCharLimit(platform: Platform): number | null {
  return CHAR_LIMIT_BY_PLATFORM[platform];
}
