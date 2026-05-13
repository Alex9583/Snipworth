import type { CaptureCourier } from '@/application/ports/CaptureCourier';
import type { Clock } from '@/application/ports/Clock';
import type { ErrorReporter } from '@/application/ports/ErrorReporter';
import type { IdGenerator } from '@/application/ports/IdGenerator';
import type { PanelOpenOutcome } from '@/application/ports/BrowserHost';
import type { CapturedSelection } from '@/domain/capture/CapturedSelection';
import { ErrorReport, type ErrorKind } from '@/domain/error-reporting/ErrorReport';
import { describeCause } from '@/domain/error-reporting/describeCause';

export interface DeliverCapturedSelectionDeps {
  readonly courier: CaptureCourier;
  readonly reporter: ErrorReporter;
  readonly clock: Clock;
  readonly ids: IdGenerator;
}

export type DeliverCapturedSelectionOutcome =
  | { readonly kind: 'delivered' }
  | { readonly kind: 'panel_open_failed'; readonly cause: unknown }
  | { readonly kind: 'storage_failed'; readonly cause: unknown };

export class DeliverCapturedSelection {
  constructor(private readonly deps: DeliverCapturedSelectionDeps) {}

  async execute(
    selection: CapturedSelection,
    panelOpening: Promise<PanelOpenOutcome>,
  ): Promise<DeliverCapturedSelectionOutcome> {
    const panelOutcome = await panelOpening;
    if (panelOutcome.kind === 'panel_open_failed') {
      await this.report('capture_panel_open_failed', panelOutcome.cause);
    }
    const storageOutcome = await this.deps.courier.deliver(selection);
    if (storageOutcome.kind === 'storage_failed') {
      await this.report('capture_storage_failed', storageOutcome.cause);
      return { kind: 'storage_failed', cause: storageOutcome.cause };
    }
    if (panelOutcome.kind === 'panel_open_failed') {
      return { kind: 'panel_open_failed', cause: panelOutcome.cause };
    }
    return { kind: 'delivered' };
  }

  private async report(kind: ErrorKind, cause: unknown): Promise<void> {
    await this.deps.reporter.report(
      ErrorReport.from({
        id: this.deps.ids.next(),
        kind,
        message: messageFor(kind),
        source: 'background',
        severity: 'error',
        occurredAt: this.deps.clock.now(),
        details: describeCause(cause),
      }),
    );
  }
}

function messageFor(kind: ErrorKind): string {
  switch (kind) {
    case 'capture_storage_failed':
      return 'Snipworth could not stage the captured selection.';
    case 'capture_panel_open_failed':
      return 'Snipworth could not open the side panel for the captured selection.';
    default:
      return 'Snipworth encountered an unexpected event.';
  }
}
