import { describe, it, expect } from 'vitest';
import { act, render, screen } from '@testing-library/react';
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
import type { DetectionOutcome, LanguageDetector } from '@/application/ports/LanguageDetector';
import { capturedLanguageLabel, detectionFallbackLabel } from '@/adapters/primary/app/strings';
import { CopySnippetAsImage } from '@/application/use-cases/CopySnippetAsImage';
import { DownloadSnippetAsImage } from '@/application/use-cases/DownloadSnippetAsImage';
import { LoadCapturedCode } from '@/application/use-cases/LoadCapturedCode';
import { CapturedSelection } from '@/domain/capture/CapturedSelection';
import { ErrorReport } from '@/domain/error-reporting/ErrorReport';
import { FakeCaptureInbox } from '../../setup/fakes/FakeCaptureInbox';
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

class StubDetector implements LanguageDetector {
  constructor(private readonly outcome: DetectionOutcome) {}

  detect(): DetectionOutcome {
    return this.outcome;
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

function aLoadingUseCase(language = 'typescript'): LoadCapturedCode {
  return new LoadCapturedCode(
    new StubDetector({ kind: 'detected', result: { language, relevance: 12 } }),
  );
}

function renderApp(overrides: Partial<AppProps> = {}) {
  const defaults: AppProps = {
    mode: 'panel',
    errorReader: new EmptyInboxReader(),
    errorAcknowledger: new NoopInboxAcknowledger(),
    copySnippetAsImage: aCopyingUseCase(),
    downloadSnippetAsImage: aDownloadingUseCase(),
    loadCapturedCode: aLoadingUseCase(),
    captureInbox: new FakeCaptureInbox(),
    clock: new FakeClock(),
  };
  return { ...render(<App {...defaults} {...overrides} />), defaults };
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

  it('should_render_the_preview_placeholder_when_no_capture_has_arrived', () => {
    renderApp();

    expect(screen.getByText('Preview placeholder')).toBeInTheDocument();
  });

  it('should_render_the_captured_code_when_a_capture_arrives', () => {
    const captureInbox = new FakeCaptureInbox();
    renderApp({ captureInbox });

    act(() => {
      captureInbox.dispatch(CapturedSelection.from({ code: 'const x = 1;', sourceUrl: undefined }));
    });

    expect(screen.getByTestId('capture-preview')).toHaveTextContent('const x = 1;');
    expect(screen.queryByText('Preview placeholder')).not.toBeInTheDocument();
  });

  it('should_render_the_detected_language_label_when_a_capture_arrives', () => {
    const captureInbox = new FakeCaptureInbox();
    renderApp({
      captureInbox,
      loadCapturedCode: aLoadingUseCase('python'),
    });

    act(() => {
      captureInbox.dispatch(CapturedSelection.from({ code: 'print(1)', sourceUrl: undefined }));
    });

    expect(screen.getByTestId('capture-language')).toHaveTextContent(
      capturedLanguageLabel('python'),
    );
  });

  it('should_render_a_fallback_notice_when_language_detection_failed', () => {
    const captureInbox = new FakeCaptureInbox();
    renderApp({
      captureInbox,
      loadCapturedCode: new LoadCapturedCode({
        detect: () => ({ kind: 'detection_failed', cause: new Error('boom') }),
      }),
    });

    act(() => {
      captureInbox.dispatch(CapturedSelection.from({ code: 'a', sourceUrl: undefined }));
    });

    expect(screen.getByRole('status')).toHaveTextContent(detectionFallbackLabel());
  });
});
