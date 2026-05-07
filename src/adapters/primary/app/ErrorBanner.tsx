import { useEffect, useState } from 'react';
import type { InboxAcknowledger, InboxReader } from '@/application/ports/ErrorInbox';
import type { ErrorReport } from '@/domain/error-reporting/ErrorReport';
import {
  dismissButtonLabel,
  inboxUnavailableLabel,
  reportButtonLabel,
  reportIssueUrl,
  unexpectedEventsLabel,
  type DismissFailure,
} from './strings';

type Status =
  | { readonly kind: 'loading' }
  | {
      readonly kind: 'loaded';
      readonly errors: readonly ErrorReport[];
      readonly dismissFailure?: DismissFailure;
    }
  | { readonly kind: 'unavailable'; readonly cause: unknown };

export function ErrorBanner({
  reader,
  acknowledger,
}: {
  reader: InboxReader;
  acknowledger: InboxAcknowledger;
}) {
  const [status, setStatus] = useState<Status>({ kind: 'loading' });

  useEffect(() => {
    let mounted = true;
    void reader.list().then((result) => {
      if (!mounted) return;
      if (result.kind === 'inbox_unavailable') {
        setStatus({ kind: 'unavailable', cause: result.cause });
      } else {
        setStatus({ kind: 'loaded', errors: result.errors });
      }
    });
    return () => {
      mounted = false;
    };
  }, [reader]);

  if (status.kind === 'loading') return null;
  if (status.kind === 'loaded' && status.errors.length === 0) return null;

  const visibleErrors = status.kind === 'loaded' ? status.errors : [];
  const label =
    status.kind === 'loaded'
      ? unexpectedEventsLabel(status.errors.length)
      : inboxUnavailableLabel();
  const dismissDisabled = status.kind !== 'loaded';
  const dismissFailure = status.kind === 'loaded' ? status.dismissFailure : undefined;

  const dismiss = async () => {
    if (status.kind !== 'loaded') return;
    const ids = status.errors.map((e) => e.id);
    const outcome = await acknowledger.acknowledge(ids);
    switch (outcome.kind) {
      case 'acknowledged':
        setStatus({ kind: 'loaded', errors: [] });
        return;
      case 'inbox_unavailable':
        setStatus({
          kind: 'loaded',
          errors: status.errors,
          dismissFailure: { kind: 'inbox_unavailable', cause: outcome.cause },
        });
        return;
      case 'background_failed':
        setStatus({
          kind: 'loaded',
          errors: status.errors,
          dismissFailure: {
            kind: 'background_failed',
            code: outcome.code,
            message: outcome.message,
          },
        });
        return;
    }
  };

  return (
    <aside
      role="alert"
      className="flex items-center gap-3 border-b border-red-700 bg-red-900/40 px-4 py-2 text-sm"
    >
      <span className="flex-1">{label}</span>
      <a
        href={reportIssueUrl(visibleErrors, dismissFailure)}
        target="_blank"
        rel="noreferrer noopener"
        className="underline"
      >
        {reportButtonLabel()}
      </a>
      <button
        type="button"
        onClick={() => {
          void dismiss();
        }}
        disabled={dismissDisabled}
        className="underline disabled:cursor-not-allowed disabled:opacity-50"
      >
        {dismissButtonLabel()}
      </button>
    </aside>
  );
}
