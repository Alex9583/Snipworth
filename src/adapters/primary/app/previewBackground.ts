import type { Background } from '@/domain/rendering/RenderConfig';

export function backgroundCss(background: Background): string {
  switch (background.type) {
    case 'solid':
      return background.color;
    case 'gradient':
      return `linear-gradient(${String(background.angle)}deg, ${background.from}, ${background.to})`;
    case 'transparent':
      return 'transparent';
  }
}
