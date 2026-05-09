import type {
  CaptureCourier,
  CaptureDeliveryTarget,
  DeliverCaptureOutcome,
} from '@/application/ports/CaptureCourier';
import type { Clock } from '@/application/ports/Clock';
import type { ErrorReporter } from '@/application/ports/ErrorReporter';
import type { IdGenerator } from '@/application/ports/IdGenerator';
import type { CapturedSelection } from '@/domain/capture/CapturedSelection';
import { ErrorReport, type ErrorKind } from '@/domain/error-reporting/ErrorReport';
import { describeCause } from '@/domain/error-reporting/describeCause';

export interface DeliverCapturedSelectionDeps {
  readonly courier: CaptureCourier;
  readonly reporter: ErrorReporter;
  readonly clock: Clock;
  readonly ids: IdGenerator;
}

export class DeliverCapturedSelection {
  constructor(private readonly deps: DeliverCapturedSelectionDeps) {}

  async execute(
    selection: CapturedSelection,
    target: CaptureDeliveryTarget,
  ): Promise<DeliverCaptureOutcome> {
    const outcome = await this.deps.courier.deliver(selection, target);
    if (outcome.kind === 'delivered') return outcome;
    await this.deps.reporter.report(this.buildReport(outcome));
    return outcome;
  }

  private buildReport(outcome: Exclude<DeliverCaptureOutcome, { kind: 'delivered' }>): ErrorReport {
    const { kind, message } = failureCopy(outcome.kind);
    return ErrorReport.from({
      id: this.deps.ids.next(),
      kind,
      message,
      source: 'background',
      severity: 'error',
      occurredAt: this.deps.clock.now(),
      details: describeCause(outcome.cause),
    });
  }
}

function failureCopy(outcomeKind: 'storage_failed' | 'panel_open_failed'): {
  readonly kind: ErrorKind;
  readonly message: string;
} {
  switch (outcomeKind) {
    case 'storage_failed':
      return {
        kind: 'capture_storage_failed',
        message: 'Snipworth could not stage the captured selection.',
      };
    case 'panel_open_failed':
      return {
        kind: 'capture_panel_open_failed',
        message: 'Snipworth could not open the side panel for the captured selection.',
      };
  }
}
