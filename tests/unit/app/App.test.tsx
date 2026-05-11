import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';

import { App } from '@/adapters/primary/app/App';
import type {
  AckOutcome,
  InboxAcknowledger,
  InboxRead,
  InboxReader,
} from '@/application/ports/ErrorInbox';
import { CopySnippetAsImage } from '@/application/use-cases/CopySnippetAsImage';
import { DownloadSnippetAsImage } from '@/application/use-cases/DownloadSnippetAsImage';
import { LoadCapturedCode } from '@/application/use-cases/LoadCapturedCode';
import { ReportSidePanelFailure } from '@/application/use-cases/ReportSidePanelFailure';
import { ErrorReport } from '@/domain/error-reporting/ErrorReport';

import { FakeCaptureInbox } from '../../setup/fakes/FakeCaptureInbox';
import { FakeClock } from '../../setup/fakes/FakeClock';
import { FakeSyntaxHighlighter } from '../../setup/fakes/FakeSyntaxHighlighter';
import { FakeUserPreferencesStore } from '../../setup/fakes/FakeUserPreferencesStore';
import { FixedIdGenerator } from '../../setup/fakes/FixedIdGenerator';
import { anExportedPng } from '../../setup/fakes/imageOutcomes';
import { SpyBlobDownloader } from '../../setup/fakes/SpyBlobDownloader';
import { SpyClipboardCopier } from '../../setup/fakes/SpyClipboardCopier';
import { SpyErrorReporter } from '../../setup/fakes/SpyErrorReporter';
import { SpyFontPreloader } from '../../setup/fakes/SpyFontPreloader';
import { SpyImageExporter } from '../../setup/fakes/SpyImageExporter';
import { StubLanguageDetector } from '../../setup/fakes/StubLanguageDetector';

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

function aFailingCopyUseCase(cause: unknown = new Error('boom')): CopySnippetAsImage {
  return new CopySnippetAsImage(
    new SpyFontPreloader(),
    new SpyImageExporter({ kind: 'rasterization_failed', cause }),
    new SpyClipboardCopier({ kind: 'copied' }),
  );
}

function aFailingDownloadUseCase(cause: unknown = new Error('boom')): DownloadSnippetAsImage {
  return new DownloadSnippetAsImage(
    new SpyFontPreloader(),
    new SpyImageExporter({ kind: 'rasterization_failed', cause }),
    new SpyBlobDownloader({ kind: 'downloaded' }),
  );
}

interface FailureCapture {
  readonly useCase: ReportSidePanelFailure;
  readonly reporter: SpyErrorReporter;
}

function captureFailures(): FailureCapture {
  const reporter = new SpyErrorReporter();
  return {
    useCase: new ReportSidePanelFailure(reporter, new FakeClock(), new FixedIdGenerator('panel')),
    reporter,
  };
}

type AppProps = Parameters<typeof App>[0];

function aCopyingUseCase(): CopySnippetAsImage {
  return new CopySnippetAsImage(
    new SpyFontPreloader(),
    new SpyImageExporter(anExportedPng()),
    new SpyClipboardCopier({ kind: 'copied' }),
  );
}

function aDownloadingUseCase(): DownloadSnippetAsImage {
  return new DownloadSnippetAsImage(
    new SpyFontPreloader(),
    new SpyImageExporter(anExportedPng()),
    new SpyBlobDownloader({ kind: 'downloaded' }),
  );
}

function aLoadingUseCase(): LoadCapturedCode {
  return new LoadCapturedCode(
    new StubLanguageDetector({
      kind: 'detected',
      result: { language: 'typescript', relevance: 12 },
    }),
  );
}

function defaultAppProps(): AppProps {
  return {
    mode: 'panel',
    errorReader: new EmptyInboxReader(),
    errorAcknowledger: new NoopInboxAcknowledger(),
    reportSidePanelFailure: captureFailures().useCase,
    copySnippetAsImage: aCopyingUseCase(),
    downloadSnippetAsImage: aDownloadingUseCase(),
    loadCapturedCode: aLoadingUseCase(),
    captureInbox: new FakeCaptureInbox(),
    syntaxHighlighter: new FakeSyntaxHighlighter(),
    userPreferencesStore: new FakeUserPreferencesStore(),
    clock: new FakeClock(),
  };
}

async function renderApp(overrides: Partial<AppProps> = {}) {
  const defaults = defaultAppProps();
  const props = { ...defaults, ...overrides };
  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(<App {...props} />);
    await Promise.resolve();
  });
  return { ...result, defaults };
}

describe('App', () => {
  it('should_render_the_app_header_with_the_brand_logo', async () => {
    await renderApp();

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /snipworth logo/i })).toBeInTheDocument();
  });

  it('should_render_three_tabs_for_code_preview_and_config', async () => {
    await renderApp();

    expect(screen.getByRole('tab', { name: /code/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /preview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /config/i })).toBeInTheDocument();
  });

  it('should_show_the_code_tab_as_active_by_default', async () => {
    await renderApp();

    expect(screen.getByRole('tab', { name: /code/i })).toHaveAttribute('aria-selected', 'true');
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

    await renderApp({ errorReader: new StubInboxReader([setupError]) });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Snipworth encountered an unexpected event.',
    );
  });

  it('should_reveal_the_export_controls_when_user_switches_to_the_preview_tab', async () => {
    const user = userEvent.setup();
    await renderApp();

    await act(async () => {
      await user.click(screen.getByRole('tab', { name: /preview/i }));
      await Promise.resolve();
    });

    expect(await screen.findByRole('button', { name: /copy/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /download/i })).toBeInTheDocument();
  });

  it('should_report_a_snippet_export_failure_when_copy_use_case_returns_export_failed', async () => {
    const failures = captureFailures();
    const user = userEvent.setup();
    await renderApp({
      reportSidePanelFailure: failures.useCase,
      copySnippetAsImage: aFailingCopyUseCase(new Error('rasterization went wrong')),
    });

    await act(async () => {
      await user.click(screen.getByRole('tab', { name: /preview/i }));
      await Promise.resolve();
    });
    await user.click(await screen.findByRole('button', { name: /copy/i }));
    await screen.findByRole('status');

    const exportFailures = failures.reporter.reports.filter(
      (r) => r.kind === 'snippet_export_failed',
    );
    expect(exportFailures).toHaveLength(1);
    expect(exportFailures[0]?.details).toBe('rasterization went wrong');
  });

  it('should_report_a_snippet_export_failure_when_download_use_case_returns_export_failed', async () => {
    const failures = captureFailures();
    const user = userEvent.setup();
    await renderApp({
      reportSidePanelFailure: failures.useCase,
      downloadSnippetAsImage: aFailingDownloadUseCase(new Error('rasterization went wrong')),
    });

    await act(async () => {
      await user.click(screen.getByRole('tab', { name: /preview/i }));
      await Promise.resolve();
    });
    await user.click(await screen.findByRole('button', { name: /download/i }));
    await screen.findByRole('status');

    const exportFailures = failures.reporter.reports.filter(
      (r) => r.kind === 'snippet_export_failed',
    );
    expect(exportFailures).toHaveLength(1);
  });
});
