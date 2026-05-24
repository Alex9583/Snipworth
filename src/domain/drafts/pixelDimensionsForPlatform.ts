import type { Platform } from '@/domain/drafts/Platform';

export type PixelDimensions =
  | { readonly kind: 'fixed'; readonly width: number; readonly height: number }
  | { readonly kind: 'auto' };

const PIXEL_DIMENSIONS_BY_PLATFORM: Readonly<Record<Platform, PixelDimensions>> = {
  'x': { kind: 'fixed', width: 1200, height: 675 },
  'linkedin': { kind: 'fixed', width: 1200, height: 628 },
  'instagram': { kind: 'fixed', width: 1080, height: 1080 },
  'instagram-story': { kind: 'fixed', width: 1080, height: 1920 },
  'thread': { kind: 'fixed', width: 1080, height: 1350 },
  'generic': { kind: 'auto' },
};

export function pixelDimensionsForPlatform(platform: Platform): PixelDimensions {
  return PIXEL_DIMENSIONS_BY_PLATFORM[platform];
}
