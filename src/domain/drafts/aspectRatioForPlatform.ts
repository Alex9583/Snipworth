import type { Platform } from '@/domain/drafts/Platform';
import type { AspectRatio } from '@/domain/rendering/RenderConfig';

const ASPECT_RATIO_BY_PLATFORM: Record<Platform, AspectRatio> = {
  'x': '16:9',
  'linkedin': '16:9',
  'instagram': '1:1',
  'instagram-story': '9:16',
  'thread': '4:5',
  'generic': 'auto',
};

export function aspectRatioForPlatform(platform: Platform): AspectRatio {
  return ASPECT_RATIO_BY_PLATFORM[platform];
}
