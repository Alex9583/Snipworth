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
  const host: BrowserHost = new ChromeBrowserHost();
  const clock = new SystemClock();
  const ids = new RandomUuidGenerator();
  const channel = new ChromeStorageErrorChannel(clock, ids);

  host.onInstalled(async () => {
    const outcome = await host.enableSidePanelOnActionClick();
    if (outcome.kind === 'configured') return;
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
  });

  host.onMessage(async ({ raw, senderId }) => {
    if (senderId !== host.selfId) {
      return { response: { ok: false, error: 'unauthorized sender' } };
    }
    try {
      const result = await route(raw, { clock, ids, inboxAcknowledger: channel });
      if (result.errorReport) {
        void emit(channel, result.errorReport);
      }
      return { response: result.response };
    } catch (cause) {
      const crashed = ErrorReport.from({
        id: ids.next(),
        kind: 'router_crashed',
        message: 'Snipworth router threw while handling a message.',
        source: 'router',
        severity: 'error',
        occurredAt: clock.now(),
        details: describeCause(cause),
      });
      void emit(channel, crashed);
      return { response: { ok: false, error: 'router crashed' } };
    }
  });
}

async function emit(reporter: ErrorReporter, report: ErrorReport): Promise<void> {
  const outcome = await reporter.report(report);
  if (outcome.kind === 'reporter_failed') {
    reporterFallback(report, outcome.cause);
  }
}

function reporterFallback(report: ErrorReport, cause: unknown): void {
  console.error('[snipworth] error reporter failed; report dropped', {
    report: report.toSnapshot(),
    cause,
  });
}
