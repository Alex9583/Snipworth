import { useCallback, type RefObject } from 'react';

import type {
  CopySnippetAsImage,
  CopySnippetOutcome,
} from '@/application/use-cases/CopySnippetAsImage';
import type { ExportScale, FontFamily } from '@/domain/rendering/RenderConfig';

import { useAsyncAction } from './useAsyncAction';

export interface CopyActionHandle {
  readonly onCopy: () => void;
  readonly status: CopySnippetOutcome | null;
}

export type CopyOutcomeListener = (outcome: CopySnippetOutcome) => void;

export interface CopyActionDeps<T extends HTMLElement> {
  readonly useCase: CopySnippetAsImage;
  readonly targetRef: RefObject<T | null>;
  readonly fontFamily: FontFamily;
  readonly scale: ExportScale;
}

export function useCopyAction<T extends HTMLElement>(
  deps: CopyActionDeps<T>,
  onOutcome?: CopyOutcomeListener,
): CopyActionHandle {
  const { useCase, targetRef, fontFamily, scale } = deps;

  const run = useCallback((): Promise<CopySnippetOutcome> | null => {
    const target = targetRef.current;
    if (target === null) return null;
    return useCase.execute(target, fontFamily, scale);
  }, [useCase, targetRef, fontFamily, scale]);

  const { trigger, status } = useAsyncAction(run, onOutcome);
  return { onCopy: trigger, status };
}
