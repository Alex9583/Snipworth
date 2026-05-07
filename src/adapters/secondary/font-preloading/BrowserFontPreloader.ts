import type { FontPreloader, PreloadFontOutcome } from '@/application/ports/FontPreloader';
import type { FontFamily } from '@/domain/rendering/RenderConfig';

export type FontFaceSetLike = Pick<FontFaceSet, 'load' | 'ready'>;

const CSS_FAMILY_BY_FONT: Record<FontFamily, string> = {
  'JetBrains Mono': 'JetBrains Mono Variable',
  'Fira Code': 'Fira Code Variable',
  'Inconsolata': 'Inconsolata Variable',
  'Source Code Pro': 'Source Code Pro Variable',
  'Cascadia Code': 'Cascadia Code Variable',
};

const PROBE_FONT_SIZE_PX = 16;

export class BrowserFontPreloader implements FontPreloader {
  private readonly fonts: FontFaceSetLike;

  constructor(fonts: FontFaceSetLike = document.fonts) {
    this.fonts = fonts;
  }

  cssFamilyFor(family: FontFamily): string {
    return CSS_FAMILY_BY_FONT[family];
  }

  async preload(family: FontFamily): Promise<PreloadFontOutcome> {
    const cssFamily = this.cssFamilyFor(family);
    try {
      await this.fonts.load(`${String(PROBE_FONT_SIZE_PX)}px '${cssFamily}'`);
      await this.fonts.ready;
      return { kind: 'preloaded' };
    } catch (cause) {
      return { kind: 'preload_failed', cause };
    }
  }
}
