import { useCallback, useEffect, useRef, useState } from 'react';

export type AsyncOutcomeListener<T> = (outcome: T) => void;

export interface AsyncActionHandle<T> {
  readonly trigger: () => void;
  readonly status: T | null;
}

const STATUS_AUTO_DISMISS_MS = 5000;

export function useAsyncAction<T>(
  run: () => Promise<T> | null,
  onOutcome?: AsyncOutcomeListener<T>,
): AsyncActionHandle<T> {
  const [status, setStatus] = useState<T | null>(null);

  const onOutcomeRef = useRef(onOutcome);
  useEffect(() => {
    onOutcomeRef.current = onOutcome;
  }, [onOutcome]);

  useEffect(() => {
    if (status === null) return;
    const handle = setTimeout(() => {
      setStatus(null);
    }, STATUS_AUTO_DISMISS_MS);
    return () => {
      clearTimeout(handle);
    };
  }, [status]);

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
