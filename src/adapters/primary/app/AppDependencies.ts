import type { CaptureInbox } from '@/application/ports/CaptureInbox';
import type { Clock } from '@/application/ports/Clock';
import type { InboxAcknowledger, InboxReader } from '@/application/ports/ErrorInbox';
import type { SyntaxHighlighter } from '@/application/ports/SyntaxHighlighter';
import type { UserPreferencesStore } from '@/application/ports/UserPreferencesStore';
import type { AutoDetectLanguage } from '@/application/use-cases/AutoDetectLanguage';
import type { CopySnippetAsImage } from '@/application/use-cases/CopySnippetAsImage';
import type { DownloadSnippetAsImage } from '@/application/use-cases/DownloadSnippetAsImage';
import type { LoadCapturedCode } from '@/application/use-cases/LoadCapturedCode';
import type { OpenFullTabEditor } from '@/application/use-cases/OpenFullTabEditor';
import type { ReportSidePanelFailure } from '@/application/use-cases/ReportSidePanelFailure';

export interface AppDependencies {
  readonly errorReader: InboxReader;
  readonly errorAcknowledger: InboxAcknowledger;
  readonly reportSidePanelFailure: ReportSidePanelFailure;
  readonly copySnippetAsImage: CopySnippetAsImage;
  readonly downloadSnippetAsImage: DownloadSnippetAsImage;
  readonly loadCapturedCode: LoadCapturedCode;
  readonly autoDetectLanguage: AutoDetectLanguage;
  readonly captureInbox: CaptureInbox;
  readonly fullTabBootstrapInbox: CaptureInbox;
  readonly syntaxHighlighter: SyntaxHighlighter;
  readonly userPreferencesStore: UserPreferencesStore;
  readonly openFullTabEditor: OpenFullTabEditor;
  readonly clock: Clock;
}
