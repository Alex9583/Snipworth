import { useRef } from 'react';
import type { AppMode } from './AppMode';
import type { Clock } from '@/application/ports/Clock';
import type { InboxAcknowledger, InboxReader } from '@/application/ports/ErrorInbox';
import type { CopySnippetAsImage } from '@/application/use-cases/CopySnippetAsImage';
import type { DownloadSnippetAsImage } from '@/application/use-cases/DownloadSnippetAsImage';
import { CopyAction } from './CopyAction';
import { DownloadAction } from './DownloadAction';
import { ErrorBanner } from './ErrorBanner';
import { appBootLabel, previewPlaceholderLabel } from './strings';

export function App({
  mode,
  errorReader,
  errorAcknowledger,
  copySnippetAsImage,
  downloadSnippetAsImage,
  clock,
}: {
  mode: AppMode;
  errorReader: InboxReader;
  errorAcknowledger: InboxAcknowledger;
  copySnippetAsImage: CopySnippetAsImage;
  downloadSnippetAsImage: DownloadSnippetAsImage;
  clock: Clock;
}) {
  const previewRef = useRef<HTMLDivElement>(null);

  return (
    <main className="flex min-h-screen flex-col">
      <ErrorBanner reader={errorReader} acknowledger={errorAcknowledger} />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
        <p className="text-ink-muted">{appBootLabel(mode)}</p>
        <div ref={previewRef} className="bg-elevated rounded-md p-6 font-mono text-sm">
          {previewPlaceholderLabel()}
        </div>
        <CopyAction useCase={copySnippetAsImage} targetRef={previewRef} />
        <DownloadAction useCase={downloadSnippetAsImage} targetRef={previewRef} clock={clock} />
      </div>
    </main>
  );
}
