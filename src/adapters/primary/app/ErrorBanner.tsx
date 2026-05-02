import { useEffect, useState } from 'react';
import type { InboxAcknowledger, InboxReader } from '@/application/ports/ErrorInbox';
import type { ErrorReport } from '@/domain/error-reporting/ErrorReport';
import {
  dismissButtonLabel,
  inboxUnavailableLabel,
  reportButtonLabel,
  reportIssueUrl,
  unexpectedEventsLabel,
} from './strings';

type Status =
  | { readonly kind: 'loading' }
  | { readonly kind: 'loaded'; readonly errors: readonly ErrorReport[] }
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
    reader
      .list()
      .then((result) => {
        if (!mounted) return;
        if (result.kind === 'inbox_unavailable') {
          console.error('[snipworth] inbox list returned unavailable', result.cause);
          setStatus({ kind: 'unavailable', cause: result.cause });
        } else {
          setStatus({ kind: 'loaded', errors: result.errors });
        }
      })
      .catch((cause: unknown) => {
        if (!mounted) return;
        console.error('[snipworth] inbox list rejected', cause);
        setStatus({ kind: 'unavailable', cause });
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

  const dismiss = async () => {
    if (status.kind !== 'loaded') return;
    const ids = status.errors.map((e) => e.id);
    let outcome;
    try {
      outcome = await acknowledger.acknowledge(ids);
    } catch (cause) {
      console.error('[snipworth] inbox acknowledge rejected', cause);
      setStatus({ kind: 'unavailable', cause });
      return;
    }
    if (outcome.kind === 'inbox_unavailable') {
      console.error('[snipworth] inbox acknowledge returned unavailable', outcome.cause);
      setStatus({ kind: 'unavailable', cause: outcome.cause });
    } else {
      setStatus({ kind: 'loaded', errors: [] });
    }
  };

  return (
    <aside
      role="alert"
      className="flex items-center gap-3 border-b border-red-700 bg-red-900/40 px-4 py-2 text-sm"
    >
      <span className="flex-1">{label}</span>
      <a
        href={reportIssueUrl(visibleErrors)}
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
