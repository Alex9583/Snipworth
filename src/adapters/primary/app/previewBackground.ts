import type { Background } from '@/domain/rendering/RenderConfig';

const FALLBACK_BACKGROUND_CSS = '#1C1C21';

export function solidBackgroundCss(background: Background): string {
  return background.type === 'solid' ? background.color : FALLBACK_BACKGROUND_CSS;
}
