import { useEffect, useRef, useState } from 'react';
import type { AppMode } from './AppMode';
import type { Clock } from '@/application/ports/Clock';
import type { CaptureInbox } from '@/application/ports/CaptureInbox';
import type { InboxAcknowledger, InboxReader } from '@/application/ports/ErrorInbox';
import type { CopySnippetAsImage } from '@/application/use-cases/CopySnippetAsImage';
import type { DownloadSnippetAsImage } from '@/application/use-cases/DownloadSnippetAsImage';
import type { LoadCapturedCode, LoadedCode } from '@/application/use-cases/LoadCapturedCode';
import { CopyAction } from './CopyAction';
import { DownloadAction } from './DownloadAction';
import { ErrorBanner } from './ErrorBanner';
import {
  appBootLabel,
  capturedLanguageLabel,
  detectionFallbackLabel,
  previewPlaceholderLabel,
} from './strings';

export function App({
  mode,
  errorReader,
  errorAcknowledger,
  copySnippetAsImage,
  downloadSnippetAsImage,
  loadCapturedCode,
  captureInbox,
  clock,
}: {
  mode: AppMode;
  errorReader: InboxReader;
  errorAcknowledger: InboxAcknowledger;
  copySnippetAsImage: CopySnippetAsImage;
  downloadSnippetAsImage: DownloadSnippetAsImage;
  loadCapturedCode: LoadCapturedCode;
  captureInbox: CaptureInbox;
  clock: Clock;
}) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState<LoadedCode | null>(null);

  useEffect(() => {
    return captureInbox.subscribe((capture) => {
      setLoaded(loadCapturedCode.execute(capture));
    });
  }, [captureInbox, loadCapturedCode]);

  return (
    <main className="flex min-h-screen flex-col">
      <ErrorBanner reader={errorReader} acknowledger={errorAcknowledger} />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
        <p className="text-ink-muted">{appBootLabel(mode)}</p>
        <div
          ref={previewRef}
          data-testid="capture-preview"
          className="bg-elevated rounded-md p-6 font-mono text-sm"
        >
          {loaded ? (
            <pre className="whitespace-pre-wrap wrap-break-word">{loaded.code}</pre>
          ) : (
            previewPlaceholderLabel()
          )}
        </div>
        {loaded ? (
          <p data-testid="capture-language" className="text-ink-muted text-xs">
            {capturedLanguageLabel(loaded.language)}
          </p>
        ) : null}
        {loaded?.detection.kind === 'fallback' ? (
          <p
            role="status"
            data-testid="capture-detection-fallback"
            className="text-ink-muted text-xs"
          >
            {detectionFallbackLabel()}
          </p>
        ) : null}
        <CopyAction useCase={copySnippetAsImage} targetRef={previewRef} />
        <DownloadAction useCase={downloadSnippetAsImage} targetRef={previewRef} clock={clock} />
      </div>
    </main>
  );
}
