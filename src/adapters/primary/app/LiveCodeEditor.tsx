import { clsx } from 'clsx';
import {
  Suspense,
  use,
  useDeferredValue,
  useRef,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { toJsxRuntime } from 'hast-util-to-jsx-runtime';

import type { HighlightLookup } from './highlightCache';

interface LiveCodeEditorProps {
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly language: string;
  readonly theme: string;
  readonly getHighlight: HighlightLookup;
  readonly label: string;
  readonly placeholder?: string;
  readonly fontSize?: number;
  readonly topRightSlot?: ReactNode;
  readonly className?: string;
}

const TYPOGRAPHY = 'font-mono leading-relaxed p-3 whitespace-pre-wrap break-words [tab-size:2]';

const OVERLAY_LAYOUT =
  'absolute inset-0 m-0 overflow-hidden pointer-events-none select-none text-ink [scrollbar-gutter:stable]';

const HAST_NORMALIZE =
  '[&_pre]:m-0 [&_pre]:p-0 [&_pre]:bg-transparent! [&_pre]:font-[inherit] [&_pre]:text-[inherit] [&_pre]:leading-[inherit] [&_pre]:whitespace-pre-wrap [&_pre]:break-words [&_code]:font-[inherit] [&_code]:bg-transparent! [&_code]:whitespace-pre-wrap [&_code]:break-words';

export function LiveCodeEditor({
  value,
  onChange,
  language,
  theme,
  getHighlight,
  label,
  placeholder,
  fontSize = 14,
  topRightSlot,
  className,
}: LiveCodeEditorProps) {
  const deferredValue = useDeferredValue(value);
  const overlayRef = useRef<HTMLDivElement>(null);

  const syncScroll = (event: React.UIEvent<HTMLTextAreaElement>): void => {
    const overlay = overlayRef.current;
    if (overlay === null) return;
    overlay.scrollTop = event.currentTarget.scrollTop;
    overlay.scrollLeft = event.currentTarget.scrollLeft;
  };

  const typographyStyle = { fontSize: `${String(fontSize)}px` } as const;

  return (
    <div
      className={clsx(
        'border-line bg-surface flex flex-col overflow-hidden rounded-md border',
        className,
      )}
    >
      {topRightSlot !== undefined ? (
        <div className="border-line flex items-center justify-end border-b px-2 py-1.5">
          {topRightSlot}
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1">
        <Suspense
          fallback={<PlainOverlay code={deferredValue} style={typographyStyle} ref={overlayRef} />}
        >
          <HighlightOverlay
            code={deferredValue}
            language={language}
            theme={theme}
            getHighlight={getHighlight}
            style={typographyStyle}
            ref={overlayRef}
          />
        </Suspense>

        <textarea
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          onScroll={syncScroll}
          aria-label={label}
          placeholder={placeholder}
          spellCheck={false}
          wrap="soft"
          style={typographyStyle}
          className={clsx(
            'absolute inset-0 h-full w-full resize-none overflow-auto border-0 [scrollbar-gutter:stable]',
            'bg-transparent text-transparent caret-ink',
            'placeholder:text-ink-muted',
            'focus-visible:outline-none',
            TYPOGRAPHY,
          )}
        />
      </div>
    </div>
  );
}

interface PlainOverlayProps {
  readonly code: string;
  readonly style?: CSSProperties;
  readonly ref?: Ref<HTMLDivElement>;
}

function PlainOverlay({ code, style, ref }: PlainOverlayProps) {
  return (
    <div
      ref={ref}
      data-overlay="plain"
      aria-hidden="true"
      style={style}
      className={clsx(OVERLAY_LAYOUT, TYPOGRAPHY)}
    >
      {code}
    </div>
  );
}

interface HighlightOverlayProps {
  readonly code: string;
  readonly language: string;
  readonly theme: string;
  readonly getHighlight: HighlightLookup;
  readonly style?: CSSProperties;
  readonly ref?: Ref<HTMLDivElement>;
}

function HighlightOverlay({
  code,
  language,
  theme,
  getHighlight,
  style,
  ref,
}: HighlightOverlayProps) {
  const highlighted = use(getHighlight(code, language, theme));
  const tree = toJsxRuntime(highlighted.hast, { Fragment, jsx, jsxs }) as ReactElement;
  return (
    <div
      ref={ref}
      data-overlay="highlight"
      aria-hidden="true"
      style={style}
      className={clsx(OVERLAY_LAYOUT, TYPOGRAPHY, HAST_NORMALIZE)}
    >
      {tree}
    </div>
  );
}
