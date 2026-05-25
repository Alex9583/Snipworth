import type { PixelDimensions } from '@/domain/drafts/pixelDimensionsForPlatform';

export function dimensionsLabel(dimensions: PixelDimensions): string {
  if (dimensions.kind === 'fixed') {
    return `${String(dimensions.width)} × ${String(dimensions.height)}`;
  }
  return '— × —';
}
