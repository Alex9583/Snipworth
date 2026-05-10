import type { CopySnippetOutcome } from '@/application/use-cases/CopySnippetAsImage';
import type { DownloadSnippetOutcome } from '@/application/use-cases/DownloadSnippetAsImage';

export const EXPORT_CONTROLS = {
  formatLabel: 'Format',
  qualityLabel: 'Quality',
  copyButton: 'Copy image',
  downloadButton: 'Download',
  estimatedSize: (width: number, height: number): string =>
    `Estimated: ${String(width)} × ${String(height)} px`,
  copyExportFailedMessage: 'Snipworth could not copy the snippet image.',
  downloadExportFailedMessage: 'Snipworth could not save the snippet image.',
} as const;

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
