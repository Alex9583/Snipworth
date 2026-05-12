import { useCallback } from 'react';

import type {
  OpenFullTabEditor,
  OpenFullTabEditorOutcome,
} from '@/application/use-cases/OpenFullTabEditor';

export type OpenFullTabOutcomeListener = (outcome: OpenFullTabEditorOutcome) => void;

export function useOpenFullTabAction(
  useCase: OpenFullTabEditor,
  code: string,
  onOutcome?: OpenFullTabOutcomeListener,
): () => void {
  return useCallback(() => {
    void useCase.execute(code).then((outcome) => {
      onOutcome?.(outcome);
    });
  }, [useCase, code, onOutcome]);
}
