import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDraftBinding } from '@/adapters/primary/library/useDraftBinding';
import { OpenDraft } from '@/application/use-cases/OpenDraft';
import {
  SaveCurrentEditorAsDraft,
  type SaveCurrentEditorAsDraftInput,
} from '@/application/use-cases/SaveCurrentEditorAsDraft';
import { UpdateDraft } from '@/application/use-cases/UpdateDraft';
import type { DraftId } from '@/domain/drafts/DraftId';
import { RenderConfig } from '@/domain/rendering/RenderConfig';

import { FakeClock } from '../../setup/fakes/FakeClock';
import { FixedIdGenerator } from '../../setup/fakes/FixedIdGenerator';
import { InMemoryDraftRepository } from '../../setup/fakes/InMemoryDraftRepository';
import { SpyUpdateDraft } from '../../setup/fakes/SpyUpdateDraft';
import { anActiveDraft } from '../../setup/mothers/DraftMother';

const FIXED_NOW = new Date('2026-05-15T10:00:00Z');
const DRAFT_1: DraftId = 'draft-1' as DraftId;

function buildHarness() {
  const repo = new InMemoryDraftRepository();
  const clock = new FakeClock(FIXED_NOW);
  const idGen = new FixedIdGenerator('draft');
  const saveUseCase = new SaveCurrentEditorAsDraft(repo, idGen, clock);
  const openUseCase = new OpenDraft(repo);
  const updateUseCase = new UpdateDraft(repo, clock);
  return { repo, clock, idGen, saveUseCase, openUseCase, updateUseCase };
}

function validSaveInput(
  overrides: Partial<SaveCurrentEditorAsDraftInput> = {},
): SaveCurrentEditorAsDraftInput {
  return {
    code: 'const x = 1;',
    language: 'typescript',
    config: RenderConfig.default(),
    caption: '',
    hashtags: [],
    platform: 'x',
    ...overrides,
  };
}

describe('useDraftBinding', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should_start_with_binding_kind_scratch_when_the_hook_is_first_rendered', () => {
    const { saveUseCase, openUseCase, updateUseCase } = buildHarness();

    const { result } = renderHook(() =>
      useDraftBinding({ saveUseCase, openUseCase, updateUseCase }),
    );

    expect(result.current.binding).toEqual({ kind: 'scratch' });
  });

  it('should_transition_to_bound_with_the_saved_snapshot_when_save_returns_saved', async () => {
    const { repo, saveUseCase, openUseCase, updateUseCase } = buildHarness();
    const { result } = renderHook(() =>
      useDraftBinding({ saveUseCase, openUseCase, updateUseCase }),
    );

    await act(async () => {
      await result.current.save(validSaveInput({ code: 'const greeting = "hello";' }));
    });

    const [persisted] = repo.savedSnapshots;
    expect(result.current.binding).toEqual({
      kind: 'bound',
      draft: persisted,
      saveStatus: 'idle',
    });
  });

  it('should_transition_to_bound_and_return_found_when_open_loads_an_existing_draft', async () => {
    const { repo, saveUseCase, openUseCase, updateUseCase } = buildHarness();
    const seeded = anActiveDraft({ id: 'draft-1' });
    await repo.save(seeded);
    const seededSnapshot = seeded.toSnapshot();
    const { result } = renderHook(() =>
      useDraftBinding({ saveUseCase, openUseCase, updateUseCase }),
    );

    const outcome = await act(async () => result.current.open(DRAFT_1));

    expect(outcome).toEqual({ kind: 'found', snapshot: seededSnapshot });
    expect(result.current.binding).toEqual({
      kind: 'bound',
      draft: seededSnapshot,
      saveStatus: 'idle',
    });
  });

  it('should_call_UpdateDraft_exactly_once_with_the_latest_patch_when_three_mutate_calls_happen_within_the_debounce_window', async () => {
    const { repo, saveUseCase, openUseCase } = buildHarness();
    const spyUpdate = new SpyUpdateDraft();
    await repo.save(anActiveDraft({ id: 'draft-1' }));
    const { result } = renderHook(() =>
      useDraftBinding({ saveUseCase, openUseCase, updateUseCase: spyUpdate }),
    );
    await act(async () => {
      await result.current.open(DRAFT_1);
    });

    act(() => {
      result.current.mutate({ caption: 'a' });
      result.current.mutate({ caption: 'ab' });
      result.current.mutate({ caption: 'abc' });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(spyUpdate.calls).toHaveLength(1);
    expect(spyUpdate.calls[0]?.id).toBe('draft-1');
    expect(spyUpdate.calls[0]?.patch).toEqual({ caption: 'abc' });
  });

  it('should_not_call_UpdateDraft_when_the_mutate_patch_equals_the_current_bound_draft_state', async () => {
    const { repo, saveUseCase, openUseCase } = buildHarness();
    const spyUpdate = new SpyUpdateDraft();
    await repo.save(anActiveDraft({ id: 'draft-1' }));
    const { result } = renderHook(() =>
      useDraftBinding({ saveUseCase, openUseCase, updateUseCase: spyUpdate }),
    );
    await act(async () => {
      await result.current.open(DRAFT_1);
    });

    act(() => {
      result.current.mutate({ caption: '' });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(spyUpdate.calls).toHaveLength(0);
  });

  it('should_queue_a_subsequent_mutate_during_an_in_flight_save_and_dispatch_after_resolution', async () => {
    const { repo, saveUseCase, openUseCase } = buildHarness();
    const spyUpdate = new SpyUpdateDraft();
    await repo.save(anActiveDraft({ id: 'draft-1' }));
    const { result } = renderHook(() =>
      useDraftBinding({ saveUseCase, openUseCase, updateUseCase: spyUpdate }),
    );
    await act(async () => {
      await result.current.open(DRAFT_1);
    });
    spyUpdate.enqueueDeferredOutcome();

    act(() => {
      result.current.mutate({ caption: 'A' });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });
    expect(spyUpdate.calls).toHaveLength(1);
    expect(spyUpdate.calls[0]?.patch).toEqual({ caption: 'A' });

    act(() => {
      result.current.mutate({ caption: 'B' });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });
    expect(spyUpdate.calls).toHaveLength(1);

    await act(async () => {
      spyUpdate.resolveNextDeferred({ kind: 'updated' });
      await Promise.resolve();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(spyUpdate.calls).toHaveLength(2);
    expect(spyUpdate.calls[1]?.patch).toEqual({ caption: 'B' });
  });

  it('should_set_binding_saveStatus_to_error_and_preserve_the_bound_draft_when_UpdateDraft_returns_storage_unavailable', async () => {
    const { repo, saveUseCase, openUseCase } = buildHarness();
    const spyUpdate = new SpyUpdateDraft();
    const seededDraft = anActiveDraft({ id: 'draft-1' });
    await repo.save(seededDraft);
    const seededSnapshot = seededDraft.toSnapshot();
    const { result } = renderHook(() =>
      useDraftBinding({ saveUseCase, openUseCase, updateUseCase: spyUpdate }),
    );
    await act(async () => {
      await result.current.open(DRAFT_1);
    });
    spyUpdate.enqueueDeferredOutcome();

    act(() => {
      result.current.mutate({ caption: 'changed' });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });
    await act(async () => {
      spyUpdate.resolveNextDeferred({ kind: 'storage_unavailable', cause: new Error('quota') });
      await Promise.resolve();
    });

    expect(result.current.binding).toEqual({
      kind: 'bound',
      draft: seededSnapshot,
      saveStatus: 'error',
    });
  });

  it('should_dispatch_the_pending_patch_immediately_when_flush_is_called_during_the_debounce_window', async () => {
    const { repo, saveUseCase, openUseCase } = buildHarness();
    const spyUpdate = new SpyUpdateDraft();
    await repo.save(anActiveDraft({ id: 'draft-1' }));
    const { result } = renderHook(() =>
      useDraftBinding({ saveUseCase, openUseCase, updateUseCase: spyUpdate }),
    );
    await act(async () => {
      await result.current.open(DRAFT_1);
    });

    act(() => {
      result.current.mutate({ caption: 'x' });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(spyUpdate.calls).toHaveLength(0);

    await act(async () => {
      await result.current.flush();
    });

    expect(spyUpdate.calls).toHaveLength(1);
    expect(spyUpdate.calls[0]?.patch).toEqual({ caption: 'x' });
  });

  it('should_flush_the_pending_patch_then_return_to_scratch_when_unbind_is_called', async () => {
    const { repo, saveUseCase, openUseCase } = buildHarness();
    const spyUpdate = new SpyUpdateDraft();
    await repo.save(anActiveDraft({ id: 'draft-1' }));
    const { result } = renderHook(() =>
      useDraftBinding({ saveUseCase, openUseCase, updateUseCase: spyUpdate }),
    );
    await act(async () => {
      await result.current.open(DRAFT_1);
    });

    act(() => {
      result.current.mutate({ caption: 'x' });
    });
    await act(async () => {
      await result.current.unbind();
    });

    expect(spyUpdate.calls).toHaveLength(1);
    expect(spyUpdate.calls[0]?.patch).toEqual({ caption: 'x' });
    expect(result.current.binding).toEqual({ kind: 'scratch' });
  });

  it('should_not_dispatch_a_scratch_era_pending_patch_after_save_transitions_to_bound', async () => {
    const { saveUseCase, openUseCase } = buildHarness();
    const spyUpdate = new SpyUpdateDraft();
    const { result } = renderHook(() =>
      useDraftBinding({ saveUseCase, openUseCase, updateUseCase: spyUpdate }),
    );

    act(() => {
      result.current.mutate({ caption: 'stale-scratch' });
    });
    await act(async () => {
      await result.current.save(validSaveInput({ code: 'const x = 1;' }));
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(spyUpdate.calls).toHaveLength(0);
  });
});
