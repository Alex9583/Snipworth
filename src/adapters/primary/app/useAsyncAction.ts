import { useCallback, useEffect, useRef, useState } from 'react';

export type AsyncOutcomeListener<T> = (outcome: T) => void;

export interface AsyncActionHandle<T> {
  readonly trigger: () => void;
  readonly status: T | null;
}

export function useAsyncAction<T>(
  run: () => Promise<T> | null,
  onOutcome?: AsyncOutcomeListener<T>,
): AsyncActionHandle<T> {
  const [status, setStatus] = useState<T | null>(null);

  const onOutcomeRef = useRef(onOutcome);
  useEffect(() => {
    onOutcomeRef.current = onOutcome;
  }, [onOutcome]);

  const trigger = useCallback(() => {
    const promise = run();
    if (promise === null) return;
    void promise.then((outcome) => {
      onOutcomeRef.current?.(outcome);
      setStatus(outcome);
    });
  }, [run]);

  return { trigger, status };
}
