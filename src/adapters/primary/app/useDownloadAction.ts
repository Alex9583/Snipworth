import { useCallback, type RefObject } from 'react';

import type { Clock } from '@/application/ports/Clock';
import type {
  DownloadSnippetAsImage,
  DownloadSnippetOutcome,
} from '@/application/use-cases/DownloadSnippetAsImage';
import { buildExportFilename } from '@/domain/export/buildExportFilename';
import type { ExportFormat, FontFamily } from '@/domain/rendering/RenderConfig';

import { useAsyncAction } from './useAsyncAction';

export interface DownloadActionHandle {
  readonly onDownload: () => void;
  readonly status: DownloadSnippetOutcome | null;
}

export type DownloadOutcomeListener = (outcome: DownloadSnippetOutcome) => void;

export function useDownloadAction<T extends HTMLElement>(
  useCase: DownloadSnippetAsImage,
  targetRef: RefObject<T | null>,
  fontFamily: FontFamily,
  format: ExportFormat,
  clock: Clock,
  onOutcome?: DownloadOutcomeListener,
): DownloadActionHandle {
  const run = useCallback((): Promise<DownloadSnippetOutcome> | null => {
    const target = targetRef.current;
    if (target === null) return null;
    const filename = buildExportFilename(clock.now(), format);
    return useCase.execute(target, fontFamily, format, filename);
  }, [useCase, targetRef, fontFamily, format, clock]);

  const { trigger, status } = useAsyncAction(run, onOutcome);
  return { onDownload: trigger, status };
}
