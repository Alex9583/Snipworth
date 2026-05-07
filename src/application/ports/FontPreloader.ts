import type { FontFamily } from '@/domain/rendering/RenderConfig';

export type PreloadFontOutcome =
  | { readonly kind: 'preloaded' }
  | { readonly kind: 'preload_failed'; readonly cause: unknown };

export interface FontPreloader {
  preload(family: FontFamily): Promise<PreloadFontOutcome>;
  cssFamilyFor(family: FontFamily): string;
}
