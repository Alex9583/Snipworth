import { ChromeStorageInboxReader } from '@/adapters/secondary/error-channel/ChromeStorageInboxReader';
import { MessagingInboxAcknowledger } from '@/adapters/secondary/error-channel/MessagingInboxAcknowledger';
import type { InboxAcknowledger, InboxReader } from '@/application/ports/ErrorInbox';

export interface AppDependencies {
  readonly errorReader: InboxReader;
  readonly errorAcknowledger: InboxAcknowledger;
}

export function composeApp(): AppDependencies {
  return {
    errorReader: new ChromeStorageInboxReader(),
    errorAcknowledger: new MessagingInboxAcknowledger(),
  };
}
