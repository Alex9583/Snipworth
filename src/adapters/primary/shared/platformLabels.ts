import type { Platform } from '@/domain/drafts/Platform';

const PLATFORM_LABELS: Readonly<Record<Platform, string>> = {
  'x': 'X',
  'linkedin': 'LinkedIn',
  'instagram': 'Instagram',
  'instagram-story': 'Story',
  'thread': 'Thread',
  'generic': 'Free',
};

export function platformDisplayLabel(platform: Platform): string {
  return PLATFORM_LABELS[platform];
}
