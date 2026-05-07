import type { AppMode } from './AppMode';
import type { InboxAcknowledger, InboxReader } from '@/application/ports/ErrorInbox';
import { ErrorBanner } from './ErrorBanner';
import { appBootLabel } from './strings';

export function App({
  mode,
  errorReader,
  errorAcknowledger,
}: {
  mode: AppMode;
  errorReader: InboxReader;
  errorAcknowledger: InboxAcknowledger;
}) {
  return (
    <main className="flex min-h-screen flex-col">
      <ErrorBanner reader={errorReader} acknowledger={errorAcknowledger} />
      <div className="flex flex-1 items-center justify-center p-4">
        <p className="text-ink-muted">{appBootLabel(mode)}</p>
      </div>
    </main>
  );
}
