import { useCallback } from 'react';

import type { FullTabOpener, OpenFullTabOutcome } from '@/application/ports/FullTabOpener';

export type OpenFullTabOutcomeListener = (outcome: OpenFullTabOutcome) => void;

export function useOpenFullTabAction(
  opener: FullTabOpener,
  onOutcome?: OpenFullTabOutcomeListener,
): () => void {
  return useCallback(() => {
    void opener.openFullTab().then((outcome) => {
      onOutcome?.(outcome);
    });
  }, [opener, onOutcome]);
}
