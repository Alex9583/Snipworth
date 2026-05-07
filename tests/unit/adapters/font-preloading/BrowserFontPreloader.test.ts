import { describe, it, expect, vi } from 'vitest';

import {
  BrowserFontPreloader,
  type FontFaceSetLike,
} from '@/adapters/secondary/font-preloading/BrowserFontPreloader';
import { fontFamilies, type FontFamily } from '@/domain/rendering/RenderConfig';

interface SpyFontFaceSet extends FontFaceSetLike {
  readonly events: string[];
}

function spyFontFaceSet(): SpyFontFaceSet {
  const events: string[] = [];
  const ready = Promise.resolve({} as FontFaceSet);
  return {
    events,
    load: vi.fn((spec: string): Promise<FontFace[]> => {
      events.push(`load:${spec}`);
      return Promise.resolve([]);
    }),
    get ready(): Promise<FontFaceSet> {
      events.push('ready');
      return ready;
    },
  };
}

describe('BrowserFontPreloader', () => {
  it('should_resolve_each_supported_family_to_its_fontsource_variable_name', () => {
    const preloader = new BrowserFontPreloader(spyFontFaceSet());

    const mappings = fontFamilies.map((family): readonly [FontFamily, string] => [
      family,
      preloader.cssFamilyFor(family),
    ]);

    expect(mappings).toEqual([
      ['JetBrains Mono', 'JetBrains Mono Variable'],
      ['Fira Code', 'Fira Code Variable'],
      ['Inconsolata', 'Inconsolata Variable'],
      ['Source Code Pro', 'Source Code Pro Variable'],
      ['Cascadia Code', 'Cascadia Code Variable'],
    ]);
  });

  it('should_return_preloaded_after_loading_the_resolved_css_family_and_awaiting_fonts_ready', async () => {
    const fonts = spyFontFaceSet();
    const preloader = new BrowserFontPreloader(fonts);

    const outcome = await preloader.preload('JetBrains Mono');

    expect(outcome).toEqual({ kind: 'preloaded' });
    expect(fonts.events).toEqual(["load:16px 'JetBrains Mono Variable'", 'ready']);
  });

  it('should_return_preload_failed_when_fonts_load_rejects', async () => {
    const cause = new Error('network blocked the woff2');
    const fonts: FontFaceSetLike = {
      load: () => Promise.reject(cause),
      get ready(): Promise<FontFaceSet> {
        return Promise.resolve({} as FontFaceSet);
      },
    };
    const preloader = new BrowserFontPreloader(fonts);

    const outcome = await preloader.preload('JetBrains Mono');

    expect(outcome).toEqual({ kind: 'preload_failed', cause });
  });

  it('should_return_preload_failed_when_fonts_ready_rejects', async () => {
    const cause = new Error('document.fonts.ready rejected');
    const fonts: FontFaceSetLike = {
      load: () => Promise.resolve([]),
      get ready(): Promise<FontFaceSet> {
        return Promise.reject(cause);
      },
    };
    const preloader = new BrowserFontPreloader(fonts);

    const outcome = await preloader.preload('JetBrains Mono');

    expect(outcome).toEqual({ kind: 'preload_failed', cause });
  });
});
