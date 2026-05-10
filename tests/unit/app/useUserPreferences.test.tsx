import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useUserPreferences } from '@/adapters/primary/app/useUserPreferences';
import type {
  LoadPrefsOutcome,
  SavePrefsOutcome,
  UserPreferencesStore,
} from '@/application/ports/UserPreferencesStore';
import { ReportSidePanelFailure } from '@/application/use-cases/ReportSidePanelFailure';
import type { UserPreferences } from '@/domain/preferences/UserPreferences';

import { deferred } from '../../setup/deferred';
import { FakeClock } from '../../setup/fakes/FakeClock';
import { FakeUserPreferencesStore } from '../../setup/fakes/FakeUserPreferencesStore';
import { FixedIdGenerator } from '../../setup/fakes/FixedIdGenerator';
import { SpyErrorReporter } from '../../setup/fakes/SpyErrorReporter';

class StubLoadingUserPreferencesStore implements UserPreferencesStore {
  readonly saves: UserPreferences[] = [];

  constructor(private readonly outcome: LoadPrefsOutcome) {}

  load(): Promise<LoadPrefsOutcome> {
    return Promise.resolve(this.outcome);
  }

  save(preferences: UserPreferences): Promise<SavePrefsOutcome> {
    this.saves.push(preferences);
    return Promise.resolve({ kind: 'saved' });
  }
}

class StallingUserPreferencesStore implements UserPreferencesStore {
  readonly saves: UserPreferences[] = [];
  private readonly pendingLoad = deferred<LoadPrefsOutcome>();

  load(): Promise<LoadPrefsOutcome> {
    return this.pendingLoad.promise;
  }

  save(preferences: UserPreferences): Promise<SavePrefsOutcome> {
    this.saves.push(preferences);
    return Promise.resolve({ kind: 'saved' });
  }
}

interface FailureCapture {
  readonly useCase: ReportSidePanelFailure;
  readonly reporter: SpyErrorReporter;
}

function captureFailures(): FailureCapture {
  const reporter = new SpyErrorReporter();
  return {
    useCase: new ReportSidePanelFailure(reporter, new FakeClock(), new FixedIdGenerator('panel')),
    reporter,
  };
}

type RenderedUserPreferences = ReturnType<
  typeof renderHook<ReturnType<typeof useUserPreferences>, unknown>
>;

function renderUserPreferences(
  store: UserPreferencesStore,
  failures: FailureCapture,
): RenderedUserPreferences {
  return renderHook(() => useUserPreferences(store, failures.useCase));
}

async function awaitLoaded(rendered: RenderedUserPreferences): Promise<void> {
  await waitFor(() => {
    expect(rendered.result.current.hasLoaded).toBe(true);
  });
}

describe('useUserPreferences', () => {
  it('should_report_a_failure_when_load_returns_corrupt', async () => {
    const failures = captureFailures();
    const store = new StubLoadingUserPreferencesStore({
      kind: 'corrupt',
      cause: new Error('schema mismatch'),
    });

    await awaitLoaded(renderUserPreferences(store, failures));

    expect(failures.reporter.reports).toHaveLength(1);
    expect(failures.reporter.reports[0]?.kind).toBe('preferences_load_failed');
    expect(failures.reporter.reports[0]?.details).toBe('schema mismatch');
  });

  it('should_report_a_failure_when_load_returns_storage_unavailable', async () => {
    const failures = captureFailures();
    const store = new StubLoadingUserPreferencesStore({
      kind: 'storage_unavailable',
      cause: new Error('quota exceeded'),
    });

    await awaitLoaded(renderUserPreferences(store, failures));

    expect(failures.reporter.reports).toHaveLength(1);
    expect(failures.reporter.reports[0]?.kind).toBe('preferences_load_failed');
  });

  it('should_not_report_when_load_succeeds', async () => {
    const failures = captureFailures();
    const store = new FakeUserPreferencesStore();

    await awaitLoaded(renderUserPreferences(store, failures));

    expect(failures.reporter.reports).toEqual([]);
  });

  it('should_not_save_default_preferences_before_load_resolves', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      const failures = captureFailures();
      const store = new StallingUserPreferencesStore();

      renderUserPreferences(store, failures);

      await act(async () => {
        vi.advanceTimersByTime(500);
        await Promise.resolve();
      });

      expect(store.saves).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should_debounce_save_calls_when_patchConfig_fires_in_quick_succession', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      const failures = captureFailures();
      const store = new FakeUserPreferencesStore();

      const { result } = renderUserPreferences(store, failures);
      await act(async () => {
        await Promise.resolve();
      });
      expect(result.current.hasLoaded).toBe(true);

      act(() => {
        result.current.patchConfig({ paddingX: 40 });
        result.current.patchConfig({ paddingX: 48 });
        result.current.patchConfig({ paddingX: 56 });
      });
      await act(async () => {
        vi.advanceTimersByTime(300);
        await Promise.resolve();
      });

      expect(store.saves).toHaveLength(1);
      expect(store.saves[0]?.defaultConfig.paddingX).toBe(56);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should_keep_renderConfig_referentially_stable_when_prefs_unchanged', async () => {
    const failures = captureFailures();
    const store = new FakeUserPreferencesStore();

    const rendered = renderUserPreferences(store, failures);
    await awaitLoaded(rendered);

    const firstSnapshot = rendered.result.current.renderConfig;
    rendered.rerender();
    const secondSnapshot = rendered.result.current.renderConfig;

    expect(secondSnapshot).toBe(firstSnapshot);
  });
});
