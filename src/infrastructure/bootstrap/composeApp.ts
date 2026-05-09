import { BrowserClipboardCopier } from '@/adapters/secondary/clipboard/BrowserClipboardCopier';
import { SystemClock } from '@/adapters/secondary/clock/SystemClock';
import { ChromeStorageInboxReader } from '@/adapters/secondary/error-channel/ChromeStorageInboxReader';
import { MessagingInboxAcknowledger } from '@/adapters/secondary/error-channel/MessagingInboxAcknowledger';
import { RandomUuidGenerator } from '@/adapters/secondary/id/RandomUuidGenerator';
import { HtmlToImageExporter } from '@/adapters/secondary/image-export/HtmlToImageExporter';
import type { InboxAcknowledger, InboxReader } from '@/application/ports/ErrorInbox';
import { CopySnippetAsImage } from '@/application/use-cases/CopySnippetAsImage';

export interface AppDependencies {
  readonly errorReader: InboxReader;
  readonly errorAcknowledger: InboxAcknowledger;
  readonly copySnippetAsImage: CopySnippetAsImage;
}

export function composeApp(): AppDependencies {
  const clock = new SystemClock();
  const ids = new RandomUuidGenerator();
  return {
    errorReader: new ChromeStorageInboxReader(clock, ids),
    errorAcknowledger: new MessagingInboxAcknowledger(),
    copySnippetAsImage: new CopySnippetAsImage(
      new HtmlToImageExporter(),
      new BrowserClipboardCopier(),
    ),
  };
}
