import { useCallback, useEffect, useMemo, useState } from 'react';

import type { UserPreferencesStore } from '@/application/ports/UserPreferencesStore';
import type { ReportSidePanelFailure } from '@/application/use-cases/ReportSidePanelFailure';
import { UserPreferences } from '@/domain/preferences/UserPreferences';
import { RenderConfig, type RenderConfigSnapshot } from '@/domain/rendering/RenderConfig';

import { APP } from './app.strings';

const SAVE_DEBOUNCE_MS = 300;

export interface UserPreferencesHandle {
  readonly prefs: UserPreferences;
  readonly hasLoaded: boolean;
  readonly renderConfig: RenderConfigSnapshot;
  readonly patchConfig: (patch: Partial<RenderConfigSnapshot>) => void;
}

export function useUserPreferences(
  store: UserPreferencesStore,
  reportFailure: ReportSidePanelFailure,
): UserPreferencesHandle {
  const [prefs, setPrefs] = useState<UserPreferences>(() => UserPreferences.default());
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    void store.load().then((outcome) => {
      if (cancelled) return;
      if (outcome.kind === 'loaded') {
        setPrefs(outcome.preferences);
      } else {
        void reportFailure.execute({
          kind: 'preferences_load_failed',
          message: APP.preferencesLoadFailedMessage,
          cause: outcome.cause,
        });
      }
      setHasLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [store, reportFailure]);

  useEffect(() => {
    if (!hasLoaded) return;
    const handle = setTimeout(() => {
      void store.save(prefs);
    }, SAVE_DEBOUNCE_MS);
    return () => {
      clearTimeout(handle);
    };
  }, [hasLoaded, prefs, store]);

  const renderConfig = useMemo(() => prefs.defaultConfig.toSnapshot(), [prefs]);

  const patchConfig = useCallback((patch: Partial<RenderConfigSnapshot>): void => {
    setPrefs((prev) =>
      prev.with({
        defaultConfig: RenderConfig.fromSnapshot({
          ...prev.defaultConfig.toSnapshot(),
          ...patch,
        }),
      }),
    );
  }, []);

  return { prefs, hasLoaded, renderConfig, patchConfig };
}
