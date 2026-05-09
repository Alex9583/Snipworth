import { useRef } from 'react';
import type { AppMode } from './AppMode';
import type { InboxAcknowledger, InboxReader } from '@/application/ports/ErrorInbox';
import type { CopySnippetAsImage } from '@/application/use-cases/CopySnippetAsImage';
import { CopyAction } from './CopyAction';
import { ErrorBanner } from './ErrorBanner';
import { appBootLabel, previewPlaceholderLabel } from './strings';

export function App({
  mode,
  errorReader,
  errorAcknowledger,
  copySnippetAsImage,
}: {
  mode: AppMode;
  errorReader: InboxReader;
  errorAcknowledger: InboxAcknowledger;
  copySnippetAsImage: CopySnippetAsImage;
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
      </div>
    </main>
  );
}
