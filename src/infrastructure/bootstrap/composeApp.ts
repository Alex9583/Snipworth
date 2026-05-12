import type { AppDependencies } from '@/adapters/primary/app/AppDependencies';
import { ChromeStorageCaptureCourier } from '@/adapters/secondary/capture/ChromeStorageCaptureCourier';
import { ChromeStorageCaptureInbox } from '@/adapters/secondary/capture/ChromeStorageCaptureInbox';
import { FULL_TAB_BOOTSTRAP_KEY } from '@/adapters/secondary/capture/pendingCaptureKey';
import { BrowserClipboardCopier } from '@/adapters/secondary/clipboard/BrowserClipboardCopier';
import { SystemClock } from '@/adapters/secondary/clock/SystemClock';
import { BrowserBlobDownloader } from '@/adapters/secondary/download/BrowserBlobDownloader';
import { ChromeStorageInboxReader } from '@/adapters/secondary/error-channel/ChromeStorageInboxReader';
import { MessagingErrorReporter } from '@/adapters/secondary/error-channel/MessagingErrorReporter';
import { MessagingInboxAcknowledger } from '@/adapters/secondary/error-channel/MessagingInboxAcknowledger';
import { BrowserFontPreloader } from '@/adapters/secondary/font-preloading/BrowserFontPreloader';
import { RandomUuidGenerator } from '@/adapters/secondary/id/RandomUuidGenerator';
import { HtmlToImageExporter } from '@/adapters/secondary/image-export/HtmlToImageExporter';
import { HighlightJsLanguageDetector } from '@/adapters/secondary/language-detection/HighlightJsLanguageDetector';
import { ChromeStorageSyncPreferences } from '@/adapters/secondary/preferences/ChromeStorageSyncPreferences';
import { ShikiSyntaxHighlighter } from '@/adapters/secondary/syntax-highlighting/ShikiSyntaxHighlighter';
import { ChromeTabOpener } from '@/adapters/secondary/tab/ChromeTabOpener';
import { AutoDetectLanguage } from '@/application/use-cases/AutoDetectLanguage';
import { CopySnippetAsImage } from '@/application/use-cases/CopySnippetAsImage';
import { DownloadSnippetAsImage } from '@/application/use-cases/DownloadSnippetAsImage';
import { LoadCapturedCode } from '@/application/use-cases/LoadCapturedCode';
import { OpenFullTabEditor } from '@/application/use-cases/OpenFullTabEditor';
import { ReportSidePanelFailure } from '@/application/use-cases/ReportSidePanelFailure';

export type { AppDependencies };

export function composeApp(): AppDependencies {
  const clock = new SystemClock();
  const ids = new RandomUuidGenerator();
  const imageExporter = new HtmlToImageExporter();
  const fontPreloader = new BrowserFontPreloader();
  const errorReporter = new MessagingErrorReporter();
  const languageDetector = new HighlightJsLanguageDetector();
  return {
    errorReader: new ChromeStorageInboxReader(clock, ids),
    errorAcknowledger: new MessagingInboxAcknowledger(),
    reportSidePanelFailure: new ReportSidePanelFailure(errorReporter, clock, ids),
    copySnippetAsImage: new CopySnippetAsImage(
      fontPreloader,
      imageExporter,
      new BrowserClipboardCopier(),
    ),
    downloadSnippetAsImage: new DownloadSnippetAsImage(
      fontPreloader,
      imageExporter,
      new BrowserBlobDownloader(),
    ),
    loadCapturedCode: new LoadCapturedCode(languageDetector),
    autoDetectLanguage: new AutoDetectLanguage(languageDetector),
    captureInbox: new ChromeStorageCaptureInbox(),
    fullTabBootstrapInbox: new ChromeStorageCaptureInbox(FULL_TAB_BOOTSTRAP_KEY),
    syntaxHighlighter: new ShikiSyntaxHighlighter(),
    userPreferencesStore: new ChromeStorageSyncPreferences(),
    openFullTabEditor: new OpenFullTabEditor(
      new ChromeStorageCaptureCourier(FULL_TAB_BOOTSTRAP_KEY),
      new ChromeTabOpener(),
    ),
    clock,
  };
}
