import {
  backgroundInboundSchema,
  type BackgroundInboundMessage,
  type ExtensionResponse,
} from '@/adapters/messaging';
import type { Clock } from '@/application/ports/Clock';
import type { InboxAcknowledger } from '@/application/ports/ErrorInbox';
import type { IdGenerator } from '@/application/ports/IdGenerator';
import { ErrorReport } from '@/domain/error-reporting/ErrorReport';
import { MAX_DETAILS_BYTES } from '@/adapters/secondary/error-channel/storage-format';

export interface RouteResult {
  readonly response: ExtensionResponse;
  readonly errorReport?: ErrorReport;
}

export interface RouteDependencies {
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly inboxAcknowledger: InboxAcknowledger;
}

export async function route(rawMessage: unknown, deps: RouteDependencies): Promise<RouteResult> {
  const parsed = backgroundInboundSchema.safeParse(rawMessage);
  if (!parsed.success) {
    return {
      response: { ok: false, error: 'malformed message' },
      errorReport: ErrorReport.from({
        id: deps.ids.next(),
        kind: 'invalid_message',
        message: 'Snipworth received a message it did not understand.',
        source: 'router',
        severity: 'warning',
        occurredAt: deps.clock.now(),
        details: JSON.stringify(parsed.error.issues).slice(0, MAX_DETAILS_BYTES),
      }),
    };
  }
  return dispatch(parsed.data, deps);
}

async function dispatch(
  message: BackgroundInboundMessage,
  deps: RouteDependencies,
): Promise<RouteResult> {
  switch (message.type) {
    case 'PING':
      return { response: { ok: true, data: 'pong' } };
    case 'ACK_ERRORS': {
      const outcome = await deps.inboxAcknowledger.acknowledge(message.acknowledgedIds);
      if (outcome.kind === 'acknowledged') return { response: { ok: true } };
      return { response: { ok: false, error: 'inbox unavailable' } };
    }
  }
}
