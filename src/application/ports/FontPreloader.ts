import type { FontFamily } from '@/domain/rendering/RenderConfig';

export interface FontPreloader {
  preload(family: FontFamily): Promise<void>;
  cssFamilyFor(family: FontFamily): string;
}
