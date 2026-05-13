import { useCallback, type RefObject } from 'react';

import type {
  CopySnippetAsImage,
  CopySnippetOutcome,
} from '@/application/use-cases/CopySnippetAsImage';
import type { FontFamily } from '@/domain/rendering/RenderConfig';

import { useAsyncAction } from './useAsyncAction';

export interface CopyActionHandle {
  readonly onCopy: () => void;
  readonly status: CopySnippetOutcome | null;
}

export type CopyOutcomeListener = (outcome: CopySnippetOutcome) => void;

export function useCopyAction<T extends HTMLElement>(
  useCase: CopySnippetAsImage,
  targetRef: RefObject<T | null>,
  fontFamily: FontFamily,
  onOutcome?: CopyOutcomeListener,
): CopyActionHandle {
  const run = useCallback((): Promise<CopySnippetOutcome> | null => {
    const target = targetRef.current;
    if (target === null) return null;
    return useCase.execute(target, fontFamily);
  }, [useCase, targetRef, fontFamily]);

  const { trigger, status } = useAsyncAction(run, onOutcome);
  return { onCopy: trigger, status };
}
