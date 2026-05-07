import type { Clock } from '@/application/ports/Clock';
import type { IdGenerator } from '@/application/ports/IdGenerator';
import { ErrorReport } from '@/domain/error-reporting/ErrorReport';
import { describeCause } from '@/domain/error-reporting/describeCause';
import { ERROR_DETAILS_MAX } from '@/domain/limits';
import { pendingErrorsSchema } from './storage-format';

export interface ParseInboxDeps {
  readonly clock: Clock;
  readonly ids: IdGenerator;
}

export type ParseInboxResult =
  | { readonly kind: 'empty' }
  | { readonly kind: 'loaded'; readonly errors: readonly ErrorReport[] }
  | { readonly kind: 'corrupt'; readonly marker: ErrorReport };

// Pure parse: callers own the rewrite policy.
// - Background channel rewrites on corruption (reconcile semantics).
// - Side-panel reader never rewrites; surfaces the marker for B-uniform UX.
export function parseInbox(raw: unknown, deps: ParseInboxDeps): ParseInboxResult {
  if (raw === undefined) return { kind: 'empty' };
  const parsed = pendingErrorsSchema.safeParse(raw);
  if (parsed.success) {
    return {
      kind: 'loaded',
      errors: parsed.data.map((s) => ErrorReport.fromSnapshot(s)),
    };
  }
  return { kind: 'corrupt', marker: corruptionMarker(parsed.error.issues, deps) };
}

function corruptionMarker(issues: unknown, deps: ParseInboxDeps): ErrorReport {
  return ErrorReport.from({
    id: deps.ids.next(),
    kind: 'error_inbox_corrupt',
    message: 'Snipworth could not read previously stored errors.',
    source: 'background',
    severity: 'warning',
    occurredAt: deps.clock.now(),
    details: describeCause(issues).slice(0, ERROR_DETAILS_MAX),
  });
}
