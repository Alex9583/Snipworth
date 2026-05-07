import type { Clock } from '@/application/ports/Clock';
import type {
  AckOutcome,
  InboxAcknowledger,
  InboxRead,
  InboxReader,
} from '@/application/ports/ErrorInbox';
import type { ErrorReporter, ReportOutcome } from '@/application/ports/ErrorReporter';
import type { IdGenerator } from '@/application/ports/IdGenerator';
import { ErrorReport } from '@/domain/error-reporting/ErrorReport';
import { describeCause } from '@/domain/error-reporting/describeCause';
import { ERROR_DETAILS_MAX } from '@/domain/limits';
import { parseInbox } from './readInbox';
import { MAX_QUEUED_REPORTS, PENDING_ERRORS_KEY } from './storage-format';

const BADGE_TEXT = '!';
const BADGE_COLOR = '#dc2626';

type RawRead =
  | { readonly kind: 'ok'; readonly value: unknown }
  | { readonly kind: 'failed'; readonly cause: unknown };

type ReadExisting =
  | {
      readonly kind: 'ok';
      readonly errors: readonly ErrorReport[];
      readonly corruption?: ErrorReport;
    }
  | { readonly kind: 'failed'; readonly cause: unknown };

type StorageWrite =
  | { readonly kind: 'written' }
  | { readonly kind: 'failed'; readonly cause: unknown };

type BadgeOp = { readonly kind: 'ok' } | { readonly kind: 'failed'; readonly cause: unknown };

export type ReconcileOutcome =
  | { readonly kind: 'reconciled' }
  | { readonly kind: 'inbox_unavailable'; readonly cause: unknown };

export class ChromeStorageErrorChannel implements ErrorReporter, InboxReader, InboxAcknowledger {
  private writeChain: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  report(error: ErrorReport): Promise<ReportOutcome> {
    return this.serialize(async () => {
      const persisted = await this.appendReports([error]);
      if (persisted.kind === 'failed') {
        return { kind: 'reporter_failed', cause: persisted.cause };
      }
      const badge = await this.setWarningBadge();
      if (badge.kind === 'failed') {
        await this.appendReports([this.badgeUnavailableReport(badge.cause)]);
      }
      return { kind: 'reported' };
    });
  }

  list(): Promise<InboxRead> {
    return this.serialize(async () => {
      const raw = await this.readRaw();
      if (raw.kind === 'failed') return { kind: 'inbox_unavailable', cause: raw.cause };

      const parsed = parseInbox(raw.value, { clock: this.clock, ids: this.ids });
      if (parsed.kind === 'empty') return { kind: 'loaded', errors: [] };
      if (parsed.kind === 'loaded') return parsed;

      const write = await this.writeSnapshots([parsed.marker.toSnapshot()]);
      if (write.kind === 'failed') return { kind: 'inbox_unavailable', cause: write.cause };
      const badge = await this.setWarningBadge();
      if (badge.kind === 'failed') {
        await this.appendReports([this.badgeUnavailableReport(badge.cause)]);
      }
      return { kind: 'loaded', errors: [parsed.marker] };
    });
  }

  async reconcile(): Promise<ReconcileOutcome> {
    const outcome = await this.list();
    if (outcome.kind === 'inbox_unavailable') {
      return { kind: 'inbox_unavailable', cause: outcome.cause };
    }
    return { kind: 'reconciled' };
  }

  acknowledge(ids: readonly string[]): Promise<AckOutcome> {
    return this.serialize(async () => {
      const ackedSet = new Set(ids);
      const existing = await this.readExisting();
      if (existing.kind === 'failed') return { kind: 'inbox_unavailable', cause: existing.cause };

      const allReports: readonly ErrorReport[] = existing.corruption
        ? [...existing.errors, existing.corruption]
        : existing.errors;
      const remaining = allReports.filter((e) => !ackedSet.has(e.id));

      const write = await this.writeSnapshots(remaining.map((e) => e.toSnapshot()));
      if (write.kind === 'failed') return { kind: 'inbox_unavailable', cause: write.cause };

      if (remaining.length === 0) {
        const badge = await this.clearBadge();
        if (badge.kind === 'failed') {
          await this.appendReports([this.badgeUnavailableReport(badge.cause)]);
        }
      }
      return { kind: 'acknowledged' };
    });
  }

  private async appendReports(toAppend: readonly ErrorReport[]): Promise<StorageWrite> {
    const existing = await this.readExisting();
    if (existing.kind === 'failed') return { kind: 'failed', cause: existing.cause };

    const all: readonly ErrorReport[] = existing.corruption
      ? [...existing.errors, existing.corruption, ...toAppend]
      : [...existing.errors, ...toAppend];
    const trimmed = all.slice(-MAX_QUEUED_REPORTS).map((e) => e.toSnapshot());
    return this.writeSnapshots(trimmed);
  }

  private async writeSnapshots(snapshots: readonly unknown[]): Promise<StorageWrite> {
    try {
      await chrome.storage.local.set({ [PENDING_ERRORS_KEY]: snapshots });
      return { kind: 'written' };
    } catch (cause) {
      return { kind: 'failed', cause };
    }
  }

  private async setWarningBadge(): Promise<BadgeOp> {
    try {
      await chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR });
      await chrome.action.setBadgeText({ text: BADGE_TEXT });
      return { kind: 'ok' };
    } catch (cause) {
      return { kind: 'failed', cause };
    }
  }

  private async clearBadge(): Promise<BadgeOp> {
    try {
      await chrome.action.setBadgeText({ text: '' });
      return { kind: 'ok' };
    } catch (cause) {
      return { kind: 'failed', cause };
    }
  }

  private async readExisting(): Promise<ReadExisting> {
    const raw = await this.readRaw();
    if (raw.kind === 'failed') return { kind: 'failed', cause: raw.cause };

    const parsed = parseInbox(raw.value, { clock: this.clock, ids: this.ids });
    switch (parsed.kind) {
      case 'empty':
        return { kind: 'ok', errors: [] };
      case 'loaded':
        return { kind: 'ok', errors: parsed.errors };
      case 'corrupt':
        return { kind: 'ok', errors: [], corruption: parsed.marker };
    }
  }

  private async readRaw(): Promise<RawRead> {
    try {
      const raw = await chrome.storage.local.get([PENDING_ERRORS_KEY]);
      return { kind: 'ok', value: raw[PENDING_ERRORS_KEY] };
    } catch (cause) {
      return { kind: 'failed', cause };
    }
  }

  private badgeUnavailableReport(cause: unknown): ErrorReport {
    return ErrorReport.from({
      id: this.ids.next(),
      kind: 'badge_unavailable',
      message: 'Snipworth could not update the action badge.',
      source: 'background',
      severity: 'warning',
      occurredAt: this.clock.now(),
      details: describeCause(cause).slice(0, ERROR_DETAILS_MAX),
    });
  }

  private serialize<T>(fn: () => Promise<T>): Promise<T> {
    // Chain `fn` on both fulfilled and rejected states so a failed prior op does not
    // poison subsequent ops; the chain proceeds whether the previous one succeeded or not.
    const next = this.writeChain.then(fn, fn);
    this.writeChain = next.catch(() => undefined);
    return next;
  }
}
