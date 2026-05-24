import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';

import type { OpenDraft, OpenDraftOutcome } from '@/application/use-cases/OpenDraft';
import type {
  SaveCurrentEditorAsDraft,
  SaveCurrentEditorAsDraftInput,
  SaveCurrentEditorAsDraftOutcome,
} from '@/application/use-cases/SaveCurrentEditorAsDraft';
import type { UpdateDraft, UpdateDraftPatch } from '@/application/use-cases/UpdateDraft';
import type { DraftSnapshot } from '@/domain/drafts/Draft';
import type { DraftId } from '@/domain/drafts/DraftId';

import type { SaveBinding } from './SaveDraftButton';

const DEBOUNCE_MS = 500;

type SaveCurrentEditorAsDraftPort = Pick<SaveCurrentEditorAsDraft, 'execute'>;
type OpenDraftPort = Pick<OpenDraft, 'execute'>;
type UpdateDraftPort = Pick<UpdateDraft, 'execute'>;

export type DraftSaveStatus = 'idle' | 'saving' | 'error';

export type DraftBinding =
  | { readonly kind: 'scratch' }
  | {
      readonly kind: 'bound';
      readonly draft: DraftSnapshot;
      readonly saveStatus: DraftSaveStatus;
    };

export interface UseDraftBindingInput {
  readonly saveUseCase: SaveCurrentEditorAsDraftPort;
  readonly openUseCase: OpenDraftPort;
  readonly updateUseCase: UpdateDraftPort;
}

export interface UseDraftBindingResult {
  readonly binding: DraftBinding;
  readonly save: (input: SaveCurrentEditorAsDraftInput) => Promise<SaveCurrentEditorAsDraftOutcome>;
  readonly open: (id: DraftId) => Promise<OpenDraftOutcome>;
  readonly mutate: (patch: UpdateDraftPatch) => void;
  readonly flush: () => Promise<void>;
  readonly unbind: () => Promise<void>;
}

export function useDraftBinding(input: UseDraftBindingInput): UseDraftBindingResult {
  const { saveUseCase, openUseCase, updateUseCase } = input;
  const [binding, setBinding] = useState<DraftBinding>({ kind: 'scratch' });
  const bindingRef = useRef(binding);
  useEffect(() => {
    bindingRef.current = binding;
  }, [binding]);

  const boundIdRef = useRef<DraftId | null>(null);
  const pendingPatchRef = useRef<UpdateDraftPatch>({});
  const queuedPatchRef = useRef<UpdateDraftPatch>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  const dispatchPending = useCallback(async (): Promise<void> => {
    const id = boundIdRef.current;
    if (id === null || bindingRef.current.kind !== 'bound') return;
    const accumulated = pendingPatchRef.current;
    pendingPatchRef.current = {};
    if (isPatchTriviallyNoop(accumulated, bindingRef.current.draft)) return;
    inFlightRef.current = true;
    setBinding((prev) => (prev.kind === 'bound' ? { ...prev, saveStatus: 'saving' } : prev));
    try {
      const outcome = await updateUseCase.execute({ id, patch: accumulated });
      if (outcome.kind === 'updated') {
        setBinding((prev) =>
          prev.kind === 'bound' ? { ...prev, draft: outcome.snapshot, saveStatus: 'idle' } : prev,
        );
      } else {
        setBinding((prev) => (prev.kind === 'bound' ? { ...prev, saveStatus: 'error' } : prev));
      }
    } finally {
      inFlightRef.current = false;
      if (hasKeys(queuedPatchRef.current)) {
        pendingPatchRef.current = queuedPatchRef.current;
        queuedPatchRef.current = {};
        armDebounce(timerRef, dispatchPending, DEBOUNCE_MS);
      }
    }
  }, [updateUseCase]);

  const mutate = useCallback(
    (patch: UpdateDraftPatch): void => {
      if (inFlightRef.current) {
        queuedPatchRef.current = { ...queuedPatchRef.current, ...patch };
        return;
      }
      pendingPatchRef.current = { ...pendingPatchRef.current, ...patch };
      armDebounce(timerRef, dispatchPending, DEBOUNCE_MS);
    },
    [dispatchPending],
  );

  const flush = useCallback(async (): Promise<void> => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    await dispatchPending();
  }, [dispatchPending]);

  const resetTransientState = (): void => {
    pendingPatchRef.current = {};
    queuedPatchRef.current = {};
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    inFlightRef.current = false;
  };

  const save = useCallback(
    async (saveInput: SaveCurrentEditorAsDraftInput): Promise<SaveCurrentEditorAsDraftOutcome> => {
      const outcome = await saveUseCase.execute(saveInput);
      if (outcome.kind === 'saved') {
        resetTransientState();
        boundIdRef.current = outcome.draftId;
        setBinding({ kind: 'bound', draft: outcome.snapshot, saveStatus: 'idle' });
      }
      return outcome;
    },
    [saveUseCase],
  );

  const open = useCallback(
    async (id: DraftId): Promise<OpenDraftOutcome> => {
      const outcome = await openUseCase.execute({ id });
      if (outcome.kind === 'found') {
        resetTransientState();
        boundIdRef.current = id;
        setBinding({ kind: 'bound', draft: outcome.snapshot, saveStatus: 'idle' });
      }
      return outcome;
    },
    [openUseCase],
  );

  const unbind = useCallback(async (): Promise<void> => {
    await flush();
    resetTransientState();
    boundIdRef.current = null;
    setBinding({ kind: 'scratch' });
  }, [flush]);

  return { binding, save, open, mutate, flush, unbind };
}

function armDebounce(
  timerRef: RefObject<ReturnType<typeof setTimeout> | null>,
  fire: () => Promise<void> | void,
  delayMs: number,
): void {
  if (timerRef.current !== null) clearTimeout(timerRef.current);
  timerRef.current = setTimeout(() => {
    timerRef.current = null;
    void fire();
  }, delayMs);
}

function isPatchTriviallyNoop(patch: UpdateDraftPatch, current: DraftSnapshot): boolean {
  return (Object.keys(patch) as (keyof UpdateDraftPatch)[]).every(
    (key) => patch[key] === current[key],
  );
}

function hasKeys(patch: UpdateDraftPatch): boolean {
  return Object.keys(patch).length > 0;
}

export function toSaveBinding(binding: DraftBinding): SaveBinding {
  if (binding.kind === 'scratch') return { kind: 'scratch' };
  return {
    kind: 'bound',
    lastSavedAt: new Date(binding.draft.updatedAt),
    saveStatus: binding.saveStatus,
  };
}
