import type { BackgroundFailureCode } from '@/application/ports/BackgroundFailure';
import type { CopySnippetOutcome } from '@/application/use-cases/CopySnippetAsImage';
import type { DownloadSnippetOutcome } from '@/application/use-cases/DownloadSnippetAsImage';
import type { ErrorReport, ErrorReportSnapshot } from '@/domain/error-reporting/ErrorReport';
import type { ExportFormat } from '@/domain/rendering/RenderConfig';
import { describeCause } from '@/domain/error-reporting/describeCause';

const ISSUES_NEW_PATH = '/issues/new';
export const ISSUE_BODY_MAX_BYTES = 6000;

export type DismissFailure =
  | { readonly kind: 'inbox_unavailable'; readonly cause: unknown }
  | {
      readonly kind: 'background_failed';
      readonly code: BackgroundFailureCode;
      readonly message: string;
    };

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
  const body = renderBody(errors, dismissFailure);
  return `${repoUrl}${ISSUES_NEW_PATH}?body=${encodeURIComponent(body)}`;
}

function renderBody(
  errors: readonly ErrorReport[],
  dismissFailure: DismissFailure | undefined,
): string {
  const dismissSection = dismissFailure ? renderDismissSection(dismissFailure) : '';
  if (errors.length === 0) {
    return [
      'Snipworth could not load its pending error inbox.',
      'No structured details are available.',
      ...(dismissSection ? ['', dismissSection] : []),
    ].join('\n');
  }
  const snapshots = errors.map((e) => e.toSnapshot());
  const fullBody = renderBodyFromSnapshots(snapshots, 0, dismissSection);
  if (fullBody.length <= ISSUE_BODY_MAX_BYTES) return fullBody;
  return renderTruncatedBody(snapshots, dismissSection);
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

function renderTruncatedBody(
  snapshots: readonly ErrorReportSnapshot[],
  dismissSection: string,
): string {
  let lo = 1;
  let hi = snapshots.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (
      renderBodyFromSnapshots(snapshots.slice(0, mid), snapshots.length - mid, dismissSection)
        .length <= ISSUE_BODY_MAX_BYTES
    ) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return renderBodyFromSnapshots(snapshots.slice(0, lo), snapshots.length - lo, dismissSection);
}

function renderBodyFromSnapshots(
  snapshots: readonly ErrorReportSnapshot[],
  remaining: number,
  dismissSection: string,
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
  if (dismissSection) {
    lines.push('', dismissSection);
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

export function copyButtonLabel(): string {
  return 'Copy as PNG';
}

export function previewPlaceholderLabel(): string {
  return 'Preview placeholder';
}

export function copyStatusLabel(outcome: CopySnippetOutcome): string {
  switch (outcome.kind) {
    case 'copied':
      return 'Copied to clipboard';
    case 'denied':
      return 'Clipboard permission denied — please allow clipboard access';
    case 'copy_failed':
      return 'Could not copy to clipboard';
    case 'export_failed':
      return 'Could not export the snippet as an image';
  }
}

export function downloadButtonLabel(format: ExportFormat): string {
  return `Download as ${format.toUpperCase()}`;
}

export function downloadStatusLabel(outcome: DownloadSnippetOutcome): string {
  switch (outcome.kind) {
    case 'downloaded':
      return 'Downloaded';
    case 'download_failed':
      return 'Could not save the file';
    case 'export_failed':
      return 'Could not export the snippet as an image';
  }
}
