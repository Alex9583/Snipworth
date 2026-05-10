import type { FontPreloader, PreloadFontOutcome } from '@/application/ports/FontPreloader';
import type { FontFamily } from '@/domain/rendering/RenderConfig';

export class SpyFontPreloader implements FontPreloader {
  readonly calls: FontFamily[] = [];

  constructor(
    private readonly outcome: PreloadFontOutcome = { kind: 'preloaded' },
    private readonly events?: string[],
  ) {}

  preload(family: FontFamily): Promise<PreloadFontOutcome> {
    this.calls.push(family);
    this.events?.push(`preload:${family}`);
    return Promise.resolve(this.outcome);
  }

  cssFamilyFor(family: FontFamily): string {
    return family;
  }
}
