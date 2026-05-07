import { SystemClock } from '@/adapters/secondary/clock/SystemClock';
import { ChromeStorageInboxReader } from '@/adapters/secondary/error-channel/ChromeStorageInboxReader';
import { MessagingInboxAcknowledger } from '@/adapters/secondary/error-channel/MessagingInboxAcknowledger';
import { RandomUuidGenerator } from '@/adapters/secondary/id/RandomUuidGenerator';
import type { InboxAcknowledger, InboxReader } from '@/application/ports/ErrorInbox';

export interface AppDependencies {
  readonly errorReader: InboxReader;
  readonly errorAcknowledger: InboxAcknowledger;
}

export function composeApp(): AppDependencies {
  const clock = new SystemClock();
  const ids = new RandomUuidGenerator();
  return {
    errorReader: new ChromeStorageInboxReader(clock, ids),
    errorAcknowledger: new MessagingInboxAcknowledger(),
  };
}
