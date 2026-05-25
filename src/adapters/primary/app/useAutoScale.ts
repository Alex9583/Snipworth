import { useLayoutEffect, useState, type RefObject } from 'react';

import { computeScaleFactor } from './computeScaleFactor';

export function useAutoScale(
  contentRef: RefObject<HTMLElement | null>,
  canvasWidth: number,
  canvasHeight: number,
  paddingPercent: number,
): number {
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (content === null) return;

    const measure = (): void => {
      setScale(
        computeScaleFactor(
          content.scrollWidth,
          content.scrollHeight,
          canvasWidth,
          canvasHeight,
          paddingPercent,
        ),
      );
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(content);
    return () => {
      observer.disconnect();
    };
  }, [contentRef, canvasWidth, canvasHeight, paddingPercent]);

  return scale;
}
