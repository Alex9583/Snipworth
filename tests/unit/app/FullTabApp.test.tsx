import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';

import { FullTabApp } from '@/adapters/primary/app/FullTabApp';
import { CapturedSelection } from '@/domain/capture/CapturedSelection';
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
import { FormatCode } from '@/application/use-cases/FormatCode';
import { LoadCapturedCode } from '@/application/use-cases/LoadCapturedCode';
import { OpenFullTabEditor } from '@/application/use-cases/OpenFullTabEditor';
import { ReportSidePanelFailure } from '@/application/use-cases/ReportSidePanelFailure';
import { UserPreferences } from '@/domain/preferences/UserPreferences';

import type {
  LoadPrefsOutcome,
  SavePrefsOutcome,
  UserPreferencesStore,
} from '@/application/ports/UserPreferencesStore';

import { FakeCaptureInbox } from '../../setup/fakes/FakeCaptureInbox';
import { buildDefaultDraftUseCases } from '../../setup/fakes/defaultDraftUseCases';
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
import { StubCodeFormatter } from '../../setup/fakes/StubCodeFormatter';
import { StubLanguageDetector } from '../../setup/fakes/StubLanguageDetector';

class EmptyInboxReader implements InboxReader {
  list(): Promise<InboxRead> {
    return Promise.resolve({ kind: 'loaded', errors: [] });
  }
}

class NoopInboxAcknowledger implements InboxAcknowledger {
  acknowledge(): Promise<AckOutcome> {
    return Promise.resolve({ kind: 'acknowledged' });
  }
}

class StubCaptureCourier implements CaptureCourier {
  readonly deliveries: CapturedSelection[] = [];

  deliver(selection: CapturedSelection): Promise<DeliverCaptureOutcome> {
    this.deliveries.push(selection);
    return Promise.resolve({ kind: 'delivered' });
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

type FullTabAppProps = Parameters<typeof FullTabApp>[0];

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

function defaultProps(): FullTabAppProps {
  return {
    errorReader: new EmptyInboxReader(),
    errorAcknowledger: new NoopInboxAcknowledger(),
    reportSidePanelFailure: new ReportSidePanelFailure(
      new SpyErrorReporter(),
      new FakeClock(),
      new FixedIdGenerator('tab'),
    ),
    copySnippetAsImage: aCopyingUseCase(),
    downloadSnippetAsImage: aDownloadingUseCase(),
    loadCapturedCode: aLoadingUseCase(),
    autoDetectLanguage: new AutoDetectLanguage(
      new StubLanguageDetector({
        kind: 'detected',
        result: { language: 'typescript', relevance: 12 },
      }),
    ),
    formatCode: new FormatCode(
      new StubCodeFormatter({ supports: false, outcome: { kind: 'formatted', code: '' } }),
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

async function renderApp(overrides: Partial<FullTabAppProps> = {}) {
  const props = { ...defaultProps(), ...overrides };
  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(<FullTabApp {...props} />);
    await Promise.resolve();
  });
  return result;
}

describe('FullTabApp', () => {
  it('should_render_nothing_while_user_preferences_are_loading', () => {
    const { container } = render(
      <FullTabApp {...defaultProps()} userPreferencesStore={new StallingUserPreferencesStore()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('should_render_the_onboarding_required_notice_when_onboarding_is_not_completed', async () => {
    await renderApp({
      userPreferencesStore: new FakeUserPreferencesStore(UserPreferences.default()),
    });

    expect(
      screen.getByRole('heading', { level: 1, name: /onboarding required/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /editor/i })).not.toBeInTheDocument();
  });

  it('should_render_the_full_tab_top_nav_with_editor_and_about_sub_tabs', async () => {
    await renderApp();

    expect(screen.getByRole('tab', { name: 'Editor' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'About' })).toBeInTheDocument();
  });

  it('should_show_the_editor_sub_tab_as_active_by_default', async () => {
    await renderApp();

    expect(screen.getByRole('tab', { name: 'Editor' })).toHaveAttribute('aria-selected', 'true');
  });

  it('should_render_the_three_column_headings_when_editor_view_is_active', async () => {
    await renderApp();

    expect(screen.getByRole('heading', { level: 2, name: /code/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /preview/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /config/i })).toBeInTheDocument();
  });

  it('should_reveal_the_about_view_when_user_switches_to_the_about_sub_tab', async () => {
    const user = userEvent.setup();
    await renderApp();

    await act(async () => {
      await user.click(screen.getByRole('tab', { name: 'About' }));
    });

    expect(screen.getByRole('heading', { level: 1, name: /snipworth/i })).toBeInTheDocument();
    expect(screen.getByText(/turn code snippets into beautiful images/i)).toBeInTheDocument();
  });

  it('should_load_the_pending_captured_code_into_the_editor_on_mount', async () => {
    const bootstrapInbox = new FakeCaptureInbox();
    await renderApp({ fullTabBootstrapInbox: bootstrapInbox });

    act(() => {
      bootstrapInbox.dispatch(
        CapturedSelection.from({ code: 'const fromPanel = 1;', sourceUrl: undefined }),
      );
    });

    expect(screen.getByRole('textbox', { name: /code/i })).toHaveValue('const fromPanel = 1;');
  });

  it('should_ignore_deliveries_to_the_side_panel_capture_inbox', async () => {
    const sidePanelInbox = new FakeCaptureInbox();
    const bootstrapInbox = new FakeCaptureInbox();
    await renderApp({ captureInbox: sidePanelInbox, fullTabBootstrapInbox: bootstrapInbox });

    act(() => {
      sidePanelInbox.dispatch(
        CapturedSelection.from({ code: 'context menu code', sourceUrl: undefined }),
      );
    });

    expect(screen.getByRole('textbox', { name: /code/i })).toHaveValue('');
  });

  it('should_preserve_typed_code_when_switching_from_editor_to_about_and_back', async () => {
    const user = userEvent.setup();
    await renderApp();

    const editor = screen.getByRole('textbox', { name: /code/i });
    await act(async () => {
      await user.type(editor, 'const x = 42;');
    });

    await act(async () => {
      await user.click(screen.getByRole('tab', { name: 'About' }));
    });
    await act(async () => {
      await user.click(screen.getByRole('tab', { name: 'Editor' }));
    });

    expect(screen.getByRole('textbox', { name: /code/i })).toHaveValue('const x = 42;');
  });
});
