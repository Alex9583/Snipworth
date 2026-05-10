import { useLayoutEffect, useState, type RefObject } from 'react';

export interface PreviewSize {
  readonly width: number;
  readonly height: number;
}

export function usePreviewSize<T extends Element>(ref: RefObject<T | null>): PreviewSize | null {
  const [size, setSize] = useState<PreviewSize | null>(null);

  useLayoutEffect(() => {
    const target = ref.current;
    if (target === null) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry === undefined) return;
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return size;
}
