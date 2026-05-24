import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';

import { SidePanelApp } from '@/adapters/primary/app/SidePanelApp';
import type {
  AckOutcome,
  InboxAcknowledger,
  InboxRead,
  InboxReader,
} from '@/application/ports/ErrorInbox';
import type { CaptureCourier, DeliverCaptureOutcome } from '@/application/ports/CaptureCourier';
import { AutoDetectLanguage } from '@/application/use-cases/AutoDetectLanguage';
import { CopySnippetAsImage } from '@/application/use-cases/CopySnippetAsImage';
import { DownloadSnippetAsImage } from '@/application/use-cases/DownloadSnippetAsImage';
import { LoadCapturedCode } from '@/application/use-cases/LoadCapturedCode';
import { OpenFullTabEditor } from '@/application/use-cases/OpenFullTabEditor';
import { ReportSidePanelFailure } from '@/application/use-cases/ReportSidePanelFailure';
import type { CapturedSelection } from '@/domain/capture/CapturedSelection';
import { ErrorReport } from '@/domain/error-reporting/ErrorReport';
import { UserPreferences } from '@/domain/preferences/UserPreferences';

import type {
  LoadPrefsOutcome,
  SavePrefsOutcome,
  UserPreferencesStore,
} from '@/application/ports/UserPreferencesStore';

import { buildDefaultDraftUseCases } from '../../setup/fakes/defaultDraftUseCases';
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
import { SpyFullTabOpener } from '../../setup/fakes/SpyFullTabOpener';
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

class StubCaptureCourier implements CaptureCourier {
  readonly deliveries: CapturedSelection[] = [];

  constructor(private readonly outcome: DeliverCaptureOutcome = { kind: 'delivered' }) {}

  deliver(selection: CapturedSelection): Promise<DeliverCaptureOutcome> {
    this.deliveries.push(selection);
    return Promise.resolve(this.outcome);
  }
}

class StallingUserPreferencesStore implements UserPreferencesStore {
  load(): Promise<LoadPrefsOutcome> {
    return new Promise(() => {
      /* never resolves */
    });
  }

  save(): Promise<SavePrefsOutcome> {
    return Promise.resolve({ kind: 'saved' });
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

type AppProps = Parameters<typeof SidePanelApp>[0];

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
    errorReader: new EmptyInboxReader(),
    errorAcknowledger: new NoopInboxAcknowledger(),
    reportSidePanelFailure: captureFailures().useCase,
    copySnippetAsImage: aCopyingUseCase(),
    downloadSnippetAsImage: aDownloadingUseCase(),
    loadCapturedCode: aLoadingUseCase(),
    autoDetectLanguage: new AutoDetectLanguage(
      new StubLanguageDetector({
        kind: 'detected',
        result: { language: 'typescript', relevance: 12 },
      }),
    ),
    captureInbox: new FakeCaptureInbox(),
    fullTabBootstrapInbox: new FakeCaptureInbox(),
    syntaxHighlighter: new FakeSyntaxHighlighter(),
    userPreferencesStore: new FakeUserPreferencesStore(
      UserPreferences.default().with({ onboardingCompleted: true }),
    ),
    openFullTabEditor: new OpenFullTabEditor(
      new StubCaptureCourier(),
      new SpyFullTabOpener({ kind: 'opened' }),
    ),
    clock: new FakeClock(),
    ...buildDefaultDraftUseCases(),
  };
}

async function renderApp(overrides: Partial<AppProps> = {}) {
  const defaults = defaultAppProps();
  const props = { ...defaults, ...overrides };
  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(<SidePanelApp {...props} />);
    await Promise.resolve();
  });
  return { ...result, defaults };
}

describe('SidePanelApp', () => {
  it('should_render_nothing_while_user_preferences_are_loading', () => {
    const props = {
      ...defaultAppProps(),
      userPreferencesStore: new StallingUserPreferencesStore(),
    };
    const { container } = render(<SidePanelApp {...props} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('should_render_the_onboarding_when_user_preferences_indicate_onboarding_is_not_completed', async () => {
    const store = new FakeUserPreferencesStore(UserPreferences.default());
    await renderApp({ userPreferencesStore: store });

    expect(screen.getByRole('heading', { name: /welcome to snipworth/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /code/i })).not.toBeInTheDocument();
  });

  it('should_reveal_the_editor_tabs_after_user_finishes_onboarding', async () => {
    const user = userEvent.setup();
    const store = new FakeUserPreferencesStore(UserPreferences.default());
    await renderApp({ userPreferencesStore: store });

    await user.click(screen.getByRole('button', { name: /get started/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /start using snipworth/i }));
    });

    expect(screen.getByRole('tab', { name: /code/i })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /welcome to snipworth/i }),
    ).not.toBeInTheDocument();
  });

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

  it('should_report_an_open_full_tab_failure_when_opener_returns_open_failed', async () => {
    const failures = captureFailures();
    const user = userEvent.setup();
    await renderApp({
      reportSidePanelFailure: failures.useCase,
      openFullTabEditor: new OpenFullTabEditor(
        new StubCaptureCourier(),
        new SpyFullTabOpener({
          kind: 'open_failed',
          cause: new Error('chrome refused to open tab'),
        }),
      ),
    });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Open in full tab' }));
      await Promise.resolve();
      await Promise.resolve();
    });

    const openFailures = failures.reporter.reports.filter((r) => r.kind === 'open_full_tab_failed');
    expect(openFailures).toHaveLength(1);
    expect(openFailures[0]?.details).toBe('chrome refused to open tab');
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
