import { clsx } from 'clsx';
import type { Root } from 'hast';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { useMemo, type ReactElement, type Ref } from 'react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';

import type { FontFamily } from '@/domain/rendering/RenderConfig';

interface PreviewProps {
  hast: Root;
  fontFamily?: FontFamily;
  paddingX?: number;
  paddingY?: number;
  background?: string;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

export function Preview({
  hast,
  fontFamily = 'JetBrains Mono',
  paddingX = 32,
  paddingY = 32,
  background = '#1C1C21',
  className,
  ref,
}: PreviewProps) {
  const tree = useMemo<ReactElement>(
    () => toJsxRuntime(hast, { Fragment, jsx, jsxs }) as ReactElement,
    [hast],
  );

  return (
    <div
      ref={ref}
      className={clsx('overflow-x-auto rounded-lg', className)}
      style={{
        padding: `${String(paddingY)}px ${String(paddingX)}px`,
        background,
        fontFamily,
      }}
    >
      {tree}
    </div>
  );
}
