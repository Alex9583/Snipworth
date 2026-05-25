import type { BackgroundFailureCode } from '@/application/ports/BackgroundFailure';
import type { ErrorReport, ErrorReportSnapshot } from '@/domain/error-reporting/ErrorReport';
import { describeCause } from '@/domain/error-reporting/describeCause';

const ISSUES_NEW_PATH = '/issues/new';
const TEMPLATE = 'bug_report.yml';
export const CONSOLE_FIELD_MAX_BYTES = 6000;

export type DismissFailure =
  | { readonly kind: 'inbox_unavailable'; readonly cause: unknown }
  | {
      readonly kind: 'background_failed';
      readonly code: BackgroundFailureCode;
      readonly message: string;
    };

export const ERROR_REPORTING = {
  inboxUnavailable: 'Snipworth could not read its pending error inbox.',
  reportButton: 'Report',
  dismissButton: 'Dismiss',
} as const;

const repoUrl: string = (() => {
  if (typeof __SNIPWORTH_REPO_URL__ !== 'string' || __SNIPWORTH_REPO_URL__.length === 0) {
    throw new Error(
      'SNIPWORTH build is misconfigured: __SNIPWORTH_REPO_URL__ define is missing or empty.',
    );
  }
  return __SNIPWORTH_REPO_URL__;
})();

export function reportIssueUrl(
  errors: readonly ErrorReport[],
  dismissFailure?: DismissFailure,
): string {
  const whatHappened = renderWhatHappened(errors, dismissFailure);
  const consoleErrors = renderConsoleErrors(errors);

  const params = [`template=${TEMPLATE}`, `what-happened=${encodeURIComponent(whatHappened)}`];
  if (consoleErrors) {
    params.push(`console=${encodeURIComponent(consoleErrors)}`);
  }
  return `${repoUrl}${ISSUES_NEW_PATH}?${params.join('&')}`;
}

export function unexpectedEventsLabel(count: number): string {
  return count === 1
    ? 'Snipworth encountered an unexpected event.'
    : `Snipworth encountered ${String(count)} unexpected events.`;
}

function renderWhatHappened(
  errors: readonly ErrorReport[],
  dismissFailure: DismissFailure | undefined,
): string {
  const lines: string[] = [];
  if (errors.length === 0) {
    lines.push(
      'Snipworth could not load its pending error inbox.',
      'No structured details are available.',
    );
  } else {
    lines.push(unexpectedEventsLabel(errors.length));
    lines.push('See the "Console errors" field below for technical details.');
  }
  if (dismissFailure) {
    lines.push('', renderDismissSection(dismissFailure));
  }
  return lines.join('\n');
}

function renderConsoleErrors(errors: readonly ErrorReport[]): string {
  if (errors.length === 0) return '';
  const snapshots = errors.map((e) => e.toSnapshot());
  const full = JSON.stringify(snapshots, null, 2);
  if (full.length <= CONSOLE_FIELD_MAX_BYTES) return full;
  return renderTruncatedConsole(snapshots);
}

function renderDismissSection(failure: DismissFailure): string {
  const lines = ['Dismiss attempt failed:'];
  switch (failure.kind) {
    case 'inbox_unavailable':
      lines.push(`- kind: inbox_unavailable`);
      lines.push(`- cause: ${describeCause(failure.cause)}`);
      break;
    case 'background_failed':
      lines.push(`- kind: background_failed`);
      lines.push(`- code: ${failure.code}`);
      lines.push(`- message: ${failure.message}`);
      break;
  }
  return lines.join('\n');
}

function renderTruncatedConsole(snapshots: readonly ErrorReportSnapshot[]): string {
  let lo = 1;
  let hi = snapshots.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (
      renderConsoleSlice(snapshots.slice(0, mid), snapshots.length - mid).length <=
      CONSOLE_FIELD_MAX_BYTES
    ) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return renderConsoleSlice(snapshots.slice(0, lo), snapshots.length - lo);
}

function renderConsoleSlice(snapshots: readonly ErrorReportSnapshot[], remaining: number): string {
  const json = JSON.stringify(snapshots, null, 2);
  if (remaining === 0) return json;
  return `${json}\n\n... (${String(remaining)} more events truncated to fit GitHub's URL budget)`;
}
