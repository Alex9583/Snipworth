import { route } from '@/adapters/primary/background/router';
import { ChromeBrowserHost } from '@/adapters/secondary/browser/ChromeBrowserHost';
import { SystemClock } from '@/adapters/secondary/clock/SystemClock';
import { ChromeStorageErrorChannel } from '@/adapters/secondary/error-channel/ChromeStorageErrorChannel';
import { RandomUuidGenerator } from '@/adapters/secondary/id/RandomUuidGenerator';
import type { BrowserHost } from '@/application/ports/BrowserHost';
import type { ErrorReporter } from '@/application/ports/ErrorReporter';
import { ErrorReport } from '@/domain/error-reporting/ErrorReport';
import { describeCause } from '@/domain/error-reporting/describeCause';

export function startBackground(): void {
  const clock = new SystemClock();
  const ids = new RandomUuidGenerator();
  const channel = new ChromeStorageErrorChannel(clock, ids);
  const host: BrowserHost = new ChromeBrowserHost((cause) => {
    void emit(
      channel,
      ErrorReport.from({
        id: ids.next(),
        kind: 'handler_crashed',
        message: 'Snipworth message handler crashed.',
        source: 'background',
        severity: 'error',
        occurredAt: clock.now(),
        details: describeCause(cause),
      }),
    );
  });

  host.onInstalled(async () => {
    const outcome = await host.enableSidePanelOnActionClick();
    if (outcome.kind !== 'configured') {
      await emit(
        channel,
        ErrorReport.from({
          id: ids.next(),
          kind: 'side_panel_setup_failed',
          message: 'Snipworth could not configure the side panel to open on click.',
          source: 'background',
          severity: 'error',
          occurredAt: clock.now(),
          details: describeCause(outcome.cause),
        }),
      );
    }
    await reconcileInbox(channel);
  });

  host.onStartup(async () => {
    await reconcileInbox(channel);
  });

  host.onMessage(async ({ raw, senderId }) => {
    if (senderId !== host.selfId) {
      return {
        response: {
          ok: false,
          error: {
            code: 'unauthorized_sender',
            message: 'Snipworth rejected a message from an unauthorized sender.',
          },
        },
      };
    }
    const result = await route(raw, { clock, ids, inboxAcknowledger: channel });
    if (result.errorReport) {
      void emit(channel, result.errorReport);
    }
    return { response: result.response };
  });
}

async function emit(reporter: ErrorReporter, report: ErrorReport): Promise<void> {
  const outcome = await reporter.report(report);
  if (outcome.kind === 'reporter_failed') {
    reporterFallback(report, outcome.cause);
  }
}

async function reconcileInbox(channel: ChromeStorageErrorChannel): Promise<void> {
  const outcome = await channel.reconcile();
  if (outcome.kind === 'inbox_unavailable') {
    console.error('[snipworth] inbox reconcile failed', {
      kind: outcome.kind,
      cause: outcome.cause,
    });
  }
}

function reporterFallback(report: ErrorReport, cause: unknown): void {
  console.error('[snipworth] error reporter failed; report dropped', {
    report: report.toSnapshot(),
    cause,
  });
}
