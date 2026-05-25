import { useLayoutEffect, useRef, useState, type ReactNode, type Ref } from 'react';

import type { PixelDimensions } from '@/domain/drafts/pixelDimensionsForPlatform';

import { useAutoScale } from '../useAutoScale';

interface ExportCanvasProps {
  readonly dimensions: PixelDimensions;
  readonly canvasBackground: string;
  readonly canvasPadding: number;
  readonly children: ReactNode;
  readonly ref?: Ref<HTMLDivElement>;
}

export function ExportCanvas({
  dimensions,
  canvasBackground,
  canvasPadding,
  children,
  ref,
}: ExportCanvasProps) {
  if (dimensions.kind === 'auto') {
    return <div ref={ref}>{children}</div>;
  }

  return (
    <FixedCanvas
      width={dimensions.width}
      height={dimensions.height}
      canvasBackground={canvasBackground}
      canvasPadding={canvasPadding}
      ref={ref}
    >
      {children}
    </FixedCanvas>
  );
}

interface FixedCanvasProps {
  readonly width: number;
  readonly height: number;
  readonly canvasBackground: string;
  readonly canvasPadding: number;
  readonly children: ReactNode;
  readonly ref?: Ref<HTMLDivElement>;
}

function FixedCanvas({
  width,
  height,
  canvasBackground,
  canvasPadding,
  children,
  ref,
}: FixedCanvasProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);
  const contentScale = useAutoScale(contentRef, width, height, canvasPadding);
  const [displayScale, setDisplayScale] = useState(1);

  useLayoutEffect(() => {
    const display = displayRef.current;
    if (display === null) return;

    const measure = (): void => {
      setDisplayScale(Math.min(display.clientWidth / width, 1));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(display);
    return () => {
      observer.disconnect();
    };
  }, [width]);

  return (
    <div
      ref={displayRef}
      className="w-full max-w-2xl"
      style={{ height: Math.round(height * displayScale), overflow: 'hidden' }}
    >
      <div style={{ transform: `scale(${String(displayScale)})`, transformOrigin: 'top left' }}>
        <div
          ref={ref}
          className="flex items-center justify-center overflow-hidden"
          style={{ width, height, background: canvasBackground }}
        >
          <div
            ref={contentRef}
            style={{
              transform: `scale(${String(contentScale)})`,
              transformOrigin: 'center center',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
