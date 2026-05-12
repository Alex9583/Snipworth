import { use, type Ref } from 'react';

import type { FontFamily } from '@/domain/rendering/RenderConfig';

import type { HighlightLookup } from './highlightCache';
import { Preview } from './ui/Preview';

interface HighlightedPreviewProps {
  readonly getHighlight: HighlightLookup;
  readonly code: string;
  readonly language: string;
  readonly theme: string;
  readonly fontFamily?: FontFamily;
  readonly background?: string;
  readonly className?: string;
  readonly ref?: Ref<HTMLDivElement>;
}

export function HighlightedPreview({
  getHighlight,
  code,
  language,
  theme,
  fontFamily,
  background,
  className,
  ref,
}: HighlightedPreviewProps) {
  const highlighted = use(getHighlight(code, language, theme));
  return (
    <Preview
      hast={highlighted.hast}
      fontFamily={fontFamily}
      background={background}
      className={className}
      ref={ref}
    />
  );
}
