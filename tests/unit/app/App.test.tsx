import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '@/adapters/primary/app/App';
import type { BlobDownloader, DownloadOutcome } from '@/application/ports/BlobDownloader';
import type { ClipboardCopier, CopyImageOutcome } from '@/application/ports/ClipboardCopier';
import type {
  AckOutcome,
  InboxAcknowledger,
  InboxRead,
  InboxReader,
} from '@/application/ports/ErrorInbox';
import type { ExportImageOutcome, ImageExporter } from '@/application/ports/ImageExporter';
import { CopySnippetAsImage } from '@/application/use-cases/CopySnippetAsImage';
import { DownloadSnippetAsImage } from '@/application/use-cases/DownloadSnippetAsImage';
import { ErrorReport } from '@/domain/error-reporting/ErrorReport';
import { FakeClock } from '../../setup/fakes/FakeClock';

class EmptyInboxReader implements InboxReader {
  list(): Promise<InboxRead> {
    return Promise.resolve({ kind: 'loaded', errors: [] });
  }
}

class StubInboxReader implements InboxReader {
  constructor(private readonly errors: readonly ErrorReport[]) {}

  list(): Promise<InboxRead> {
    return Promise.resolve({ kind: 'loaded', errors: this.errors });
  }
}

class NoopInboxAcknowledger implements InboxAcknowledger {
  acknowledge(): Promise<AckOutcome> {
    return Promise.resolve({ kind: 'acknowledged' });
  }
}

class StubImageExporter implements ImageExporter {
  constructor(private readonly outcome: ExportImageOutcome) {}

  export(): Promise<ExportImageOutcome> {
    return Promise.resolve(this.outcome);
  }
}

class StubClipboardCopier implements ClipboardCopier {
  constructor(private readonly outcome: CopyImageOutcome) {}

  copyImage(): Promise<CopyImageOutcome> {
    return Promise.resolve(this.outcome);
  }
}

class StubBlobDownloader implements BlobDownloader {
  constructor(private readonly outcome: DownloadOutcome) {}

  download(): Promise<DownloadOutcome> {
    return Promise.resolve(this.outcome);
  }
}

type AppProps = Parameters<typeof App>[0];

function anExportedPng(): ExportImageOutcome {
  return {
    kind: 'exported',
    blob: new Blob(['png-bytes'], { type: 'image/png' }),
  };
}

function aCopyingUseCase(): CopySnippetAsImage {
  return new CopySnippetAsImage(
    new StubImageExporter(anExportedPng()),
    new StubClipboardCopier({ kind: 'copied' }),
  );
}

function aDownloadingUseCase(): DownloadSnippetAsImage {
  return new DownloadSnippetAsImage(
    new StubImageExporter(anExportedPng()),
    new StubBlobDownloader({ kind: 'downloaded' }),
  );
}

function renderApp(overrides: Partial<AppProps> = {}) {
  const defaults: AppProps = {
    mode: 'panel',
    errorReader: new EmptyInboxReader(),
    errorAcknowledger: new NoopInboxAcknowledger(),
    copySnippetAsImage: aCopyingUseCase(),
    downloadSnippetAsImage: aDownloadingUseCase(),
    clock: new FakeClock(),
  };
  return render(<App {...defaults} {...overrides} />);
}

describe('App', () => {
  it('should_render_the_boot_label_with_the_provided_mode', () => {
    renderApp({ mode: 'panel' });

    expect(screen.getByText('App boot OK in panel mode.')).toBeInTheDocument();
  });

  it('should_render_the_tab_mode_label_when_mode_is_tab', () => {
    renderApp({ mode: 'tab' });

    expect(screen.getByText('App boot OK in tab mode.')).toBeInTheDocument();
  });

  it('should_render_the_error_banner_alert_when_inbox_holds_an_error', async () => {
    const setupError = ErrorReport.from({
      id: 'setup-1',
      kind: 'side_panel_setup_failed',
      message: 'Could not configure the side panel.',
      source: 'background',
      severity: 'error',
      occurredAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    renderApp({ errorReader: new StubInboxReader([setupError]) });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Snipworth encountered an unexpected event.',
    );
  });
});
