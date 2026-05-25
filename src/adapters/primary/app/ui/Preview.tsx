import { clsx } from 'clsx';
import type { Root } from 'hast';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';
import { useMemo, type ReactElement, type Ref } from 'react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';

import { cssFontFamily } from '@/adapters/font-faces/cssFontFamily';
import type { FontFamily } from '@/domain/rendering/RenderConfig';

interface PreviewProps {
  hast: Root;
  title?: string;
  fontFamily?: FontFamily;
  fontSize?: number;
  background?: string;
  className?: string;
  compact?: boolean;
  ref?: Ref<HTMLDivElement>;
}

const TRAFFIC_LIGHTS = [
  { color: '#ff5f57', label: 'close' },
  { color: '#febc2e', label: 'minimize' },
  { color: '#28c840', label: 'expand' },
] as const;

const HAST_NORMALIZE =
  '[&_pre]:m-0 [&_pre]:bg-transparent! [&_pre]:font-[inherit] [&_pre]:text-[inherit] [&_pre]:leading-[inherit] [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_code]:font-[inherit] [&_code]:bg-transparent! [&_code]:whitespace-pre-wrap [&_code]:break-words';

export function Preview({
  hast,
  title,
  fontFamily = 'JetBrains Mono',
  fontSize = 14,
  background = '#1C1C21',
  className,
  compact = false,
  ref,
}: PreviewProps) {
  const tree = useMemo<ReactElement>(
    () => toJsxRuntime(hast, { Fragment, jsx, jsxs }) as ReactElement,
    [hast],
  );
  const cssFamily = cssFontFamily(fontFamily);

  return (
    <div
      ref={ref}
      className={clsx('flex items-center justify-center overflow-hidden rounded-lg', className)}
      style={{
        background,
        fontFamily: cssFamily,
        fontSize: `${String(fontSize)}px`,
      }}
    >
      <div className="w-full overflow-hidden rounded-md shadow-2xl" style={{ background }}>
        <div
          aria-hidden="true"
          className={clsx(
            'flex items-center border-b border-white/5',
            compact ? 'gap-1 px-2.5 py-2' : 'gap-1.5 px-4 py-3',
          )}
        >
          {TRAFFIC_LIGHTS.map((light) => (
            <span
              key={light.label}
              className={clsx('block rounded-full', compact ? 'h-2 w-2' : 'h-3 w-3')}
              style={{ background: light.color }}
            />
          ))}
          {title !== undefined && title.length > 0 && (
            <span className="flex-1 truncate text-center text-xs text-white/50">{title}</span>
          )}
        </div>
        <div
          className={clsx('leading-relaxed', compact ? 'px-3 py-3' : 'px-4 py-4', HAST_NORMALIZE)}
        >
          {tree}
        </div>
      </div>
    </div>
  );
}
