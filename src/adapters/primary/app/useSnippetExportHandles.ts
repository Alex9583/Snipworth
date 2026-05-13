import type { RefObject } from 'react';

import type { Clock } from '@/application/ports/Clock';
import {
  type CopySnippetAsImage,
  type CopySnippetOutcome,
} from '@/application/use-cases/CopySnippetAsImage';
import {
  type DownloadSnippetAsImage,
  type DownloadSnippetOutcome,
} from '@/application/use-cases/DownloadSnippetAsImage';
import type { ReportSidePanelFailure } from '@/application/use-cases/ReportSidePanelFailure';
import type { ExportFormat, FontFamily } from '@/domain/rendering/RenderConfig';

import { EXPORT_CONTROLS } from './ui/ExportControls.strings';
import { useCopyAction, type CopyActionHandle } from './useCopyAction';
import { useDownloadAction, type DownloadActionHandle } from './useDownloadAction';

export interface SnippetExportHandlesDeps<T extends HTMLElement> {
  readonly copySnippetAsImage: CopySnippetAsImage;
  readonly downloadSnippetAsImage: DownloadSnippetAsImage;
  readonly reportSidePanelFailure: ReportSidePanelFailure;
  readonly previewRef: RefObject<T | null>;
  readonly fontFamily: FontFamily;
  readonly exportFormat: ExportFormat;
  readonly clock: Clock;
}

export interface SnippetExportHandles {
  readonly copyHandle: CopyActionHandle;
  readonly downloadHandle: DownloadActionHandle;
}

export function useSnippetExportHandles<T extends HTMLElement>(
  deps: SnippetExportHandlesDeps<T>,
): SnippetExportHandles {
  const reportExportFailure = (message: string, outcome: { readonly cause?: unknown }): void => {
    void deps.reportSidePanelFailure.execute({
      kind: 'snippet_export_failed',
      message,
      cause: outcome.cause,
    });
  };

  const onCopyOutcome = (outcome: CopySnippetOutcome): void => {
    if (outcome.kind === 'copied') return;
    reportExportFailure(EXPORT_CONTROLS.copyExportFailedMessage, outcome);
  };

  const onDownloadOutcome = (outcome: DownloadSnippetOutcome): void => {
    if (outcome.kind === 'downloaded') return;
    reportExportFailure(EXPORT_CONTROLS.downloadExportFailedMessage, outcome);
  };

  const copyHandle = useCopyAction(
    deps.copySnippetAsImage,
    deps.previewRef,
    deps.fontFamily,
    onCopyOutcome,
  );
  const downloadHandle = useDownloadAction(
    deps.downloadSnippetAsImage,
    deps.previewRef,
    deps.fontFamily,
    deps.exportFormat,
    deps.clock,
    onDownloadOutcome,
  );

  return { copyHandle, downloadHandle };
}
