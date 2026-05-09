import { BrowserClipboardCopier } from '@/adapters/secondary/clipboard/BrowserClipboardCopier';
import { SystemClock } from '@/adapters/secondary/clock/SystemClock';
import { BrowserBlobDownloader } from '@/adapters/secondary/download/BrowserBlobDownloader';
import { ChromeStorageInboxReader } from '@/adapters/secondary/error-channel/ChromeStorageInboxReader';
import { MessagingInboxAcknowledger } from '@/adapters/secondary/error-channel/MessagingInboxAcknowledger';
import { RandomUuidGenerator } from '@/adapters/secondary/id/RandomUuidGenerator';
import { HtmlToImageExporter } from '@/adapters/secondary/image-export/HtmlToImageExporter';
import type { Clock } from '@/application/ports/Clock';
import type { InboxAcknowledger, InboxReader } from '@/application/ports/ErrorInbox';
import { CopySnippetAsImage } from '@/application/use-cases/CopySnippetAsImage';
import { DownloadSnippetAsImage } from '@/application/use-cases/DownloadSnippetAsImage';

export interface AppDependencies {
  readonly errorReader: InboxReader;
  readonly errorAcknowledger: InboxAcknowledger;
  readonly copySnippetAsImage: CopySnippetAsImage;
  readonly downloadSnippetAsImage: DownloadSnippetAsImage;
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
    clock,
  };
}
