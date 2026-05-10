import { route } from '@/adapters/primary/background/router';
import { ChromeBrowserHost } from '@/adapters/secondary/browser/ChromeBrowserHost';
import { ChromeStorageCaptureCourier } from '@/adapters/secondary/capture/ChromeStorageCaptureCourier';
import { SystemClock } from '@/adapters/secondary/clock/SystemClock';
import { ChromeStorageErrorChannel } from '@/adapters/secondary/error-channel/ChromeStorageErrorChannel';
import { RandomUuidGenerator } from '@/adapters/secondary/id/RandomUuidGenerator';
import type { BrowserHost } from '@/application/ports/BrowserHost';
import type { Clock } from '@/application/ports/Clock';
import type { ErrorReporter } from '@/application/ports/ErrorReporter';
import type { IdGenerator } from '@/application/ports/IdGenerator';
import { DeliverCapturedSelection } from '@/application/use-cases/DeliverCapturedSelection';
import { CapturedSelection } from '@/domain/capture/CapturedSelection';
import { ErrorReport } from '@/domain/error-reporting/ErrorReport';
import { describeCause } from '@/domain/error-reporting/describeCause';

interface BackgroundContext {
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly reporter: ErrorReporter;
}

export function startBackground(): void {
  const clock = new SystemClock();
  const ids = new RandomUuidGenerator();
  const channel = new ChromeStorageErrorChannel(clock, ids);
  const ctx: BackgroundContext = { clock, ids, reporter: channel };
  const courier = new ChromeStorageCaptureCourier();
  const deliverCapture = new DeliverCapturedSelection({ courier, ...ctx });
  const host: BrowserHost = new ChromeBrowserHost((cause) => {
    void emit(
      ctx,
      ErrorReport.from({
        id: ctx.ids.next(),
        kind: 'handler_crashed',
        message: 'Snipworth message handler crashed.',
        source: 'background',
        severity: 'error',
        occurredAt: ctx.clock.now(),
        details: describeCause(cause),
      }),
    );
  });

  host.onInstalled(async () => {
    const sidePanelOutcome = await host.enableSidePanelOnActionClick();
    if (sidePanelOutcome.kind !== 'configured') {
      await emit(
        ctx,
        ErrorReport.from({
          id: ctx.ids.next(),
          kind: 'side_panel_setup_failed',
          message: 'Snipworth could not configure the side panel to open on click.',
          source: 'background',
          severity: 'error',
          occurredAt: ctx.clock.now(),
          details: describeCause(sidePanelOutcome.cause),
        }),
      );
    }
    const menuOutcome = await host.installCaptureContextMenu();
    if (menuOutcome.kind !== 'installed') {
      await emit(
        ctx,
        ErrorReport.from({
          id: ctx.ids.next(),
          kind: 'context_menu_install_failed',
          message: 'Snipworth could not install the capture context menu.',
          source: 'background',
          severity: 'error',
          occurredAt: ctx.clock.now(),
          details: describeCause(menuOutcome.cause),
        }),
      );
    }
    await reconcileInbox(channel);
  });

  host.onStartup(async () => {
    await reconcileInbox(channel);
  });

  host.onCaptureRequested(async (request) => {
    const selection = CapturedSelection.from({
      code: request.code,
      sourceUrl: request.sourceUrl,
    });
    await deliverCapture.execute(selection, { tabId: request.tabId });
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
    const result = await route(raw, {
      clock,
      ids,
      inboxAcknowledger: channel,
      errorReporter: channel,
    });
    if (result.errorReport) {
      void emit(ctx, result.errorReport);
    }
    return { response: result.response };
  });
}

async function emit(ctx: BackgroundContext, report: ErrorReport): Promise<void> {
  const outcome = await ctx.reporter.report(report);
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
