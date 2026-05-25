import { useCallback, type RefObject } from 'react';

import type { Clock } from '@/application/ports/Clock';
import type {
  DownloadSnippetAsImage,
  DownloadSnippetOutcome,
} from '@/application/use-cases/DownloadSnippetAsImage';
import { buildExportFilename } from '@/domain/export/buildExportFilename';
import type { ExportFormat, ExportScale, FontFamily } from '@/domain/rendering/RenderConfig';

import { useAsyncAction } from './useAsyncAction';

export interface DownloadActionHandle {
  readonly onDownload: () => void;
  readonly status: DownloadSnippetOutcome | null;
}

export type DownloadOutcomeListener = (outcome: DownloadSnippetOutcome) => void;

export interface DownloadActionDeps<T extends HTMLElement> {
  readonly useCase: DownloadSnippetAsImage;
  readonly targetRef: RefObject<T | null>;
  readonly fontFamily: FontFamily;
  readonly scale: ExportScale;
  readonly format: ExportFormat;
  readonly clock: Clock;
}

export function useDownloadAction<T extends HTMLElement>(
  deps: DownloadActionDeps<T>,
  onOutcome?: DownloadOutcomeListener,
): DownloadActionHandle {
  const { useCase, targetRef, fontFamily, scale, format, clock } = deps;

  const run = useCallback((): Promise<DownloadSnippetOutcome> | null => {
    const target = targetRef.current;
    if (target === null) return null;
    const filename = buildExportFilename(clock.now(), format);
    return useCase.execute(target, { fontFamily, scale, format, filename });
  }, [useCase, targetRef, fontFamily, scale, format, clock]);

  const { trigger, status } = useAsyncAction(run, onOutcome);
  return { onDownload: trigger, status };
}
