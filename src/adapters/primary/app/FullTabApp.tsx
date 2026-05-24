import {
  Activity,
  useCallback,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react';

import { CaptionBar } from '@/adapters/primary/library/CaptionBar';
import { SaveDraftButton } from '@/adapters/primary/library/SaveDraftButton';
import { LibraryView } from '@/adapters/primary/library/LibraryView';
import { toSaveBinding, useDraftBinding } from '@/adapters/primary/library/useDraftBinding';
import { useLibraryDrafts } from '@/adapters/primary/library/useLibraryDrafts';
import type { DraftId } from '@/domain/drafts/DraftId';
import { RenderConfig } from '@/domain/rendering/RenderConfig';

import { AboutView } from './AboutView';
import type { AppDependencies } from './AppDependencies';
import { CodeColumn } from './CodeColumn';
import { ConfigColumn } from './ConfigColumn';
import { ErrorBanner } from './ErrorBanner';
import type { FullTabView } from './FullTabView';
import { OnboardingRequiredNotice } from './OnboardingRequiredNotice';
import { PreviewColumn } from './PreviewColumn';
import { createHighlightCache } from './highlightCache';
import { TabTopNav } from './ui/TabTopNav';
import { useEditorLanguageState } from './useEditorLanguageState';
import { useEditorSession } from './useEditorSession';
import { useSnippetExportHandles } from './useSnippetExportHandles';
import { useUserPreferences } from './useUserPreferences';

export function FullTabApp({
  errorReader,
  errorAcknowledger,
  reportSidePanelFailure,
  copySnippetAsImage,
  downloadSnippetAsImage,
  loadCapturedCode,
  autoDetectLanguage,
  fullTabBootstrapInbox,
  syntaxHighlighter,
  userPreferencesStore,
  clock,
  saveDraft,
  openDraft,
  updateDraft,
  deleteDraft,
  archiveDraft,
  restoreDraft,
  listDrafts,
}: AppDependencies) {
  const [view, setView] = useState<FullTabView>('editor');
  const previewRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => new Date());

  const handleViewChange = useCallback((next: FullTabView) => {
    if (next === 'library') setNow(new Date());
    setView(next);
  }, []);

  const { code, setCode, language, detection, pickLanguage } = useEditorLanguageState(
    fullTabBootstrapInbox,
    loadCapturedCode,
    autoDetectLanguage,
  );

  const { prefs, hasLoaded, renderConfig, patchConfig } = useUserPreferences(
    userPreferencesStore,
    reportSidePanelFailure,
  );

  const draftBinding = useDraftBinding({
    saveUseCase: saveDraft,
    openUseCase: openDraft,
    updateUseCase: updateDraft,
  });

  const session = useEditorSession({ initialPlatform: prefs.defaultPlatform });

  const library = useLibraryDrafts({ listDrafts, archiveDraft, restoreDraft, deleteDraft });

  const deferredCode = useDeferredValue(code);
  const getHighlight = useMemo(() => createHighlightCache(syntaxHighlighter), [syntaxHighlighter]);

  const { copyHandle, downloadHandle } = useSnippetExportHandles({
    copySnippetAsImage,
    downloadSnippetAsImage,
    reportSidePanelFailure,
    previewRef,
    fontFamily: renderConfig.fontFamily,
    exportFormat: renderConfig.exportFormat,
    clock,
  });

  const boundId = draftBinding.binding.kind === 'bound' ? draftBinding.binding.draft.id : null;

  const syncFromDraft = useEffectEvent(() => {
    if (draftBinding.binding.kind !== 'bound') return;
    const snapshot = draftBinding.binding.draft;
    session.applySnapshot(snapshot);
    setCode(snapshot.code);
    pickLanguage(snapshot.language);
  });

  useEffect(() => {
    syncFromDraft();
  }, [boundId]);

  const pushToBoundDraft = useEffectEvent((patch: Parameters<typeof draftBinding.mutate>[0]) => {
    if (draftBinding.binding.kind !== 'bound') return;
    draftBinding.mutate(patch);
  });

  useEffect(() => {
    pushToBoundDraft({ code, language });
  }, [code, language]);

  useEffect(() => {
    pushToBoundDraft({ platform: session.platform });
  }, [session.platform]);

  useEffect(() => {
    pushToBoundDraft({ caption: session.caption });
  }, [session.caption]);

  useEffect(() => {
    pushToBoundDraft({ hashtags: session.hashtags });
  }, [session.hashtags]);

  useEffect(() => {
    pushToBoundDraft({ config: RenderConfig.fromSnapshot(renderConfig) });
  }, [renderConfig]);

  const handleSave = useCallback(async () => {
    await draftBinding.save({
      code,
      language,
      config: RenderConfig.fromSnapshot(renderConfig),
      caption: session.caption,
      hashtags: session.hashtags,
      platform: session.platform,
    });
  }, [
    draftBinding,
    code,
    language,
    renderConfig,
    session.caption,
    session.hashtags,
    session.platform,
  ]);

  const handleFlush = useCallback(() => {
    void draftBinding.flush();
  }, [draftBinding]);

  const handleOpenDraft = useCallback(
    async (id: DraftId) => {
      await draftBinding.open(id);
      setView('editor');
    },
    [draftBinding],
  );

  const handleNewDraft = useCallback(async () => {
    await draftBinding.unbind();
    session.resetToDefault(prefs.defaultPlatform);
    setCode('');
    pickLanguage('plaintext');
    setView('editor');
  }, [draftBinding, session, prefs.defaultPlatform, setCode, pickLanguage]);

  const saveBinding = toSaveBinding(draftBinding.binding);
  const modKey: 'mac' | 'pc' = navigator.platform.includes('Mac') ? 'mac' : 'pc';

  if (!hasLoaded) {
    return null;
  }

  if (!prefs.onboardingCompleted) {
    return <OnboardingRequiredNotice />;
  }

  return (
    <div className="bg-canvas text-ink flex h-screen flex-col">
      <TabTopNav activeView={view} onChangeView={handleViewChange} />

      <Activity mode={view === 'editor' ? 'visible' : 'hidden'}>
        <main className="flex min-h-0 flex-1 flex-col">
          <ErrorBanner reader={errorReader} acknowledger={errorAcknowledger} />
          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
            <CodeColumn
              code={code}
              onCodeChange={setCode}
              language={language}
              detection={detection}
              onLanguageChange={pickLanguage}
              theme={renderConfig.theme}
              fontSize={renderConfig.fontSize}
              getHighlight={getHighlight}
            />
            <PreviewColumn
              platform={session.platform}
              onPlatformChange={session.setPlatform}
              previewRef={previewRef}
              getHighlight={getHighlight}
              code={deferredCode}
              language={language}
              renderConfig={renderConfig}
              patchConfig={patchConfig}
              copyHandle={copyHandle}
              downloadHandle={downloadHandle}
              saveSlot={
                <SaveDraftButton
                  binding={saveBinding}
                  modKey={modKey}
                  onSave={() => {
                    void handleSave();
                  }}
                  onFlush={handleFlush}
                  onRetry={() => {
                    void handleSave();
                  }}
                />
              }
            />
            <ConfigColumn renderConfig={renderConfig} patchConfig={patchConfig} />
          </div>
          <CaptionBar
            caption={session.caption}
            platform={session.platform}
            onCaptionChange={session.setCaption}
            onHashtagsChange={session.setHashtags}
          />
        </main>
      </Activity>

      <Activity mode={view === 'library' ? 'visible' : 'hidden'}>
        <LibraryView
          library={library}
          now={now}
          getHighlight={getHighlight}
          onOpenDraft={(id) => {
            void handleOpenDraft(id);
          }}
          onCreateFirstDraft={() => {
            void handleNewDraft();
          }}
          onReportCorruption={() => {
            /* no-op for V1 — corrupt rows are visible but not reportable yet */
          }}
          onShowHelp={() => {
            setView('about');
          }}
        />
      </Activity>

      <Activity mode={view === 'about' ? 'visible' : 'hidden'}>
        <AboutView />
      </Activity>
    </div>
  );
}
