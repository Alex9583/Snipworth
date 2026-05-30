import { useCallback } from 'react';

import type { FormatCode, FormatResult } from '@/application/use-cases/FormatCode';

import { useAsyncAction } from './useAsyncAction';

export interface FormatHandleDeps {
  readonly useCase: FormatCode;
  readonly code: string;
  readonly language: string;
  readonly applyFormattedCode: (code: string) => void;
}

export interface FormatHandle {
  readonly canFormat: boolean;
  readonly onFormat: () => void;
  readonly status: FormatResult | null;
}

export function useFormatHandle(deps: FormatHandleDeps): FormatHandle {
  const { useCase, code, language, applyFormattedCode } = deps;
  const canFormat = useCase.supports(language);

  const run = useCallback(() => useCase.execute(code, language), [useCase, code, language]);

  const onOutcome = useCallback(
    (result: FormatResult) => {
      if (result.kind === 'formatted') applyFormattedCode(result.code);
    },
    [applyFormattedCode],
  );

  const { trigger, status } = useAsyncAction(run, onOutcome);
  return { canFormat, onFormat: trigger, status };
}
