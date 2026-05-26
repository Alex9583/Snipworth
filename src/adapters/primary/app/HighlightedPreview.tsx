import { use, type Ref } from 'react';

import type { FontFamily } from '@/domain/rendering/RenderConfig';

import type { HighlightLookup } from './highlightCache';
import { Preview } from './ui/Preview';

interface HighlightedPreviewProps {
  readonly getHighlight: HighlightLookup;
  readonly code: string;
  readonly language: string;
  readonly theme: string;
  readonly title?: string;
  readonly titleColor?: string;
  readonly titleFontSize?: number;
  readonly fontFamily?: FontFamily;
  readonly fontSize?: number;
  readonly background?: string;
  readonly className?: string;
  readonly compact?: boolean;
  readonly ref?: Ref<HTMLDivElement>;
}

export function HighlightedPreview({
  getHighlight,
  code,
  language,
  theme,
  title,
  titleColor,
  titleFontSize,
  fontFamily,
  fontSize,
  background,
  className,
  compact,
  ref,
}: HighlightedPreviewProps) {
  const highlighted = use(getHighlight(code, language, theme));
  return (
    <Preview
      hast={highlighted.hast}
      title={title}
      titleColor={titleColor}
      titleFontSize={titleFontSize}
      fontFamily={fontFamily}
      fontSize={fontSize}
      background={background}
      className={className}
      compact={compact}
      ref={ref}
    />
  );
}
