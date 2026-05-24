import type { Platform } from '@/domain/drafts/Platform';
import type { AspectRatio } from '@/domain/rendering/RenderConfig';

const ASPECT_RATIO_BY_PLATFORM = {
  'x': { kind: 'fixed', ratio: '16:9' },
  'linkedin': { kind: 'fixed', ratio: '1.91:1' },
  'instagram': { kind: 'fixed', ratio: '1:1' },
  'instagram-story': { kind: 'fixed', ratio: '9:16' },
  'thread': { kind: 'fixed', ratio: '4:5' },
  'generic': { kind: 'auto' },
} as const satisfies Record<Platform, AspectRatio>;

export function aspectRatioForPlatform(platform: Platform): AspectRatio {
  return ASPECT_RATIO_BY_PLATFORM[platform];
}
