import { ChromeStorageCaptureInbox } from '@/adapters/secondary/capture/ChromeStorageCaptureInbox';
import { BrowserClipboardCopier } from '@/adapters/secondary/clipboard/BrowserClipboardCopier';
import { SystemClock } from '@/adapters/secondary/clock/SystemClock';
import { BrowserBlobDownloader } from '@/adapters/secondary/download/BrowserBlobDownloader';
import { ChromeStorageInboxReader } from '@/adapters/secondary/error-channel/ChromeStorageInboxReader';
import { MessagingInboxAcknowledger } from '@/adapters/secondary/error-channel/MessagingInboxAcknowledger';
import { RandomUuidGenerator } from '@/adapters/secondary/id/RandomUuidGenerator';
import { HtmlToImageExporter } from '@/adapters/secondary/image-export/HtmlToImageExporter';
import { HighlightJsLanguageDetector } from '@/adapters/secondary/language-detection/HighlightJsLanguageDetector';
import type { CaptureInbox } from '@/application/ports/CaptureInbox';
import type { Clock } from '@/application/ports/Clock';
import type { InboxAcknowledger, InboxReader } from '@/application/ports/ErrorInbox';
import { CopySnippetAsImage } from '@/application/use-cases/CopySnippetAsImage';
import { DownloadSnippetAsImage } from '@/application/use-cases/DownloadSnippetAsImage';
import { LoadCapturedCode } from '@/application/use-cases/LoadCapturedCode';

export interface AppDependencies {
  readonly errorReader: InboxReader;
  readonly errorAcknowledger: InboxAcknowledger;
  readonly copySnippetAsImage: CopySnippetAsImage;
  readonly downloadSnippetAsImage: DownloadSnippetAsImage;
  readonly loadCapturedCode: LoadCapturedCode;
  readonly captureInbox: CaptureInbox;
  readonly clock: Clock;
}

export function composeApp(): AppDependencies {
  const clock = new SystemClock();
  const ids = new RandomUuidGenerator();
  const imageExporter = new HtmlToImageExporter();
  return {
    errorReader: new ChromeStorageInboxReader(clock, ids),
    errorAcknowledger: new MessagingInboxAcknowledger(),
    copySnippetAsImage: new CopySnippetAsImage(imageExporter, new BrowserClipboardCopier()),
    downloadSnippetAsImage: new DownloadSnippetAsImage(imageExporter, new BrowserBlobDownloader()),
    loadCapturedCode: new LoadCapturedCode(new HighlightJsLanguageDetector()),
    captureInbox: new ChromeStorageCaptureInbox(),
    clock,
  };
}
