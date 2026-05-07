import type { Clock } from '@/application/ports/Clock';
import type { InboxRead, InboxReader } from '@/application/ports/ErrorInbox';
import type { IdGenerator } from '@/application/ports/IdGenerator';
import { parseInbox } from './readInbox';
import { PENDING_ERRORS_KEY } from './storage-format';

export class ChromeStorageInboxReader implements InboxReader {
  constructor(
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async list(): Promise<InboxRead> {
    let raw: Record<string, unknown>;
    try {
      raw = await chrome.storage.local.get([PENDING_ERRORS_KEY]);
    } catch (cause) {
      return { kind: 'inbox_unavailable', cause };
    }
    const parsed = parseInbox(raw[PENDING_ERRORS_KEY], { clock: this.clock, ids: this.ids });
    if (parsed.kind === 'empty') return { kind: 'loaded', errors: [] };
    if (parsed.kind === 'loaded') return parsed;
    return { kind: 'loaded', errors: [parsed.marker] };
  }
}
