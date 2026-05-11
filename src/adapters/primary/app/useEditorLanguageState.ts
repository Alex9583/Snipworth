import { useCallback, useEffect, useState } from 'react';

import type { CaptureInbox } from '@/application/ports/CaptureInbox';
import type { AutoDetectLanguage } from '@/application/use-cases/AutoDetectLanguage';
import type { DetectionStatus, LoadCapturedCode } from '@/application/use-cases/LoadCapturedCode';

interface LanguageState {
  readonly value: string;
  readonly detection: DetectionStatus;
}

export interface EditorLanguageStateHandle {
  readonly code: string;
  readonly setCode: (next: string) => void;
  readonly language: string;
  readonly detection: DetectionStatus;
  readonly pickLanguage: (next: string) => void;
}

const PLAINTEXT = 'plaintext';
const DETECTION_DEBOUNCE_MS = 300;

export function useEditorLanguageState(
  inbox: CaptureInbox,
  loadCapturedCode: LoadCapturedCode,
  autoDetectLanguage: AutoDetectLanguage,
): EditorLanguageStateHandle {
  const [code, setCode] = useState<string>('');
  const [languageState, setLanguageState] = useState<LanguageState>(() => ({
    value: PLAINTEXT,
    detection: { kind: 'idle' },
  }));

  useEffect(() => {
    return inbox.subscribe((capture) => {
      const loaded = loadCapturedCode.execute(capture);
      setCode(loaded.code);
      setLanguageState({ value: loaded.language, detection: loaded.detection });
    });
  }, [inbox, loadCapturedCode]);

  useEffect(() => {
    if (code === '') return;
    const handle = setTimeout(() => {
      setLanguageState((prev) => {
        if (prev.detection.kind === 'manual') return prev;
        const detected = autoDetectLanguage.execute(code);
        return { value: detected.language, detection: detected.detection };
      });
    }, DETECTION_DEBOUNCE_MS);
    return () => {
      clearTimeout(handle);
    };
  }, [code, autoDetectLanguage]);

  const pickLanguage = useCallback((next: string): void => {
    setLanguageState({ value: next, detection: { kind: 'manual' } });
  }, []);

  const effective: LanguageState =
    code === '' && languageState.detection.kind !== 'manual'
      ? { value: PLAINTEXT, detection: { kind: 'idle' } }
      : languageState;

  return {
    code,
    setCode,
    language: effective.value,
    detection: effective.detection,
    pickLanguage,
  };
}
