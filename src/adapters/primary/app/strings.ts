import type { ErrorReport, ErrorReportSnapshot } from '@/domain/error-reporting/ErrorReport';

const ISSUES_NEW_PATH = '/issues/new';
export const ISSUE_BODY_MAX_BYTES = 6000;

const repoUrl: string = (() => {
  if (typeof __SNIPWORTH_REPO_URL__ !== 'string' || __SNIPWORTH_REPO_URL__.length === 0) {
    throw new Error(
      'SNIPWORTH build is misconfigured: __SNIPWORTH_REPO_URL__ define is missing or empty.',
    );
  }
  return __SNIPWORTH_REPO_URL__;
})();

export function reportIssueUrl(errors: readonly ErrorReport[]): string {
  const body = renderBody(errors);
  return `${repoUrl}${ISSUES_NEW_PATH}?body=${encodeURIComponent(body)}`;
}

function renderBody(errors: readonly ErrorReport[]): string {
  if (errors.length === 0) {
    return [
      'Snipworth could not load its pending error inbox.',
      'No structured details are available.',
    ].join('\n');
  }
  const snapshots = errors.map((e) => e.toSnapshot());
  const fullBody = renderBodyFromSnapshots(snapshots, 0);
  if (fullBody.length <= ISSUE_BODY_MAX_BYTES) return fullBody;
  return renderTruncatedBody(snapshots);
}

function renderTruncatedBody(snapshots: readonly ErrorReportSnapshot[]): string {
  let lo = 1;
  let hi = snapshots.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (
      renderBodyFromSnapshots(snapshots.slice(0, mid), snapshots.length - mid).length <=
      ISSUE_BODY_MAX_BYTES
    ) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return renderBodyFromSnapshots(snapshots.slice(0, lo), snapshots.length - lo);
}

function renderBodyFromSnapshots(
  snapshots: readonly ErrorReportSnapshot[],
  remaining: number,
): string {
  const lines = [
    'Snipworth encountered the following unexpected events:',
    '',
    '```json',
    JSON.stringify(snapshots, null, 2),
    '```',
  ];
  if (remaining > 0) {
    lines.push('', `... (${String(remaining)} more events truncated to fit GitHub's URL budget)`);
  }
  return lines.join('\n');
}

export function unexpectedEventsLabel(count: number): string {
  return count === 1
    ? 'Snipworth encountered an unexpected event.'
    : `Snipworth encountered ${String(count)} unexpected events.`;
}

export function inboxUnavailableLabel(): string {
  return 'Snipworth could not read its pending error inbox.';
}

export function reportButtonLabel(): string {
  return 'Report';
}

export function dismissButtonLabel(): string {
  return 'Dismiss';
}

export function appBootLabel(mode: string): string {
  return `App boot OK in ${mode} mode.`;
}
