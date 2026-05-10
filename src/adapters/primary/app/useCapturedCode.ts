import { useCallback, useEffect, useState } from 'react';

import type { CaptureInbox } from '@/application/ports/CaptureInbox';
import type { DetectionStatus, LoadCapturedCode } from '@/application/use-cases/LoadCapturedCode';

interface LanguageState {
  readonly value: string;
  readonly detection: DetectionStatus;
}

export interface CapturedCodeHandle {
  readonly code: string;
  readonly setCode: (next: string) => void;
  readonly language: string;
  readonly detection: DetectionStatus;
  readonly pickLanguage: (next: string) => void;
}

export function useCapturedCode(
  inbox: CaptureInbox,
  loadCapturedCode: LoadCapturedCode,
): CapturedCodeHandle {
  const [code, setCode] = useState<string>('');
  const [languageState, setLanguageState] = useState<LanguageState>(() => ({
    value: 'plaintext',
    detection: { kind: 'detected' },
  }));

  useEffect(() => {
    return inbox.subscribe((capture) => {
      const loaded = loadCapturedCode.execute(capture);
      setCode(loaded.code);
      setLanguageState({ value: loaded.language, detection: loaded.detection });
    });
  }, [inbox, loadCapturedCode]);

  const pickLanguage = useCallback((next: string): void => {
    setLanguageState({ value: next, detection: { kind: 'detected' } });
  }, []);

  return {
    code,
    setCode,
    language: languageState.value,
    detection: languageState.detection,
    pickLanguage,
  };
}
