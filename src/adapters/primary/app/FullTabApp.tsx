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

import { useDraftAutoSync } from '@/adapters/primary/library/useDraftAutoSync';

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
  const canvasRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => new Date());
  const [openSeq, setOpenSeq] = useState(0);

  const { code, setCode, language, detection, pickLanguage, resetLanguage } =
    useEditorLanguageState(fullTabBootstrapInbox, loadCapturedCode, autoDetectLanguage);

  const { prefs, hasLoaded, renderConfig, patchConfig, patchPrefs } = useUserPreferences(
    userPreferencesStore,
    reportSidePanelFailure,
  );

  const draftBinding = useDraftBinding({
    saveUseCase: saveDraft,
    openUseCase: openDraft,
    updateUseCase: updateDraft,
  });

  const session = useEditorSession({ initialPlatform: prefs.defaultPlatform });
  const { setPlatform } = session;

  useEffect(() => {
    if (draftBinding.binding.kind === 'scratch') {
      setPlatform(prefs.defaultPlatform);
    }
  }, [prefs.defaultPlatform, draftBinding.binding.kind, setPlatform]);

  const library = useLibraryDrafts({ listDrafts, archiveDraft, restoreDraft, deleteDraft });
  const refreshLibrary = library.refresh;

  const handleViewChange = useCallback(
    (next: FullTabView) => {
      if (next === 'library') {
        setNow(new Date());
        void refreshLibrary();
      }
      setView(next);
    },
    [refreshLibrary],
  );

  const deferredCode = useDeferredValue(code);
  const getHighlight = useMemo(() => createHighlightCache(syntaxHighlighter), [syntaxHighlighter]);

  const { copyHandle, downloadHandle } = useSnippetExportHandles({
    copySnippetAsImage,
    downloadSnippetAsImage,
    reportSidePanelFailure,
    canvasRef,
    fontFamily: renderConfig.fontFamily,
    exportScale: renderConfig.exportScale,
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
  }, [boundId, openSeq]);

  useDraftAutoSync(draftBinding, {
    code,
    language,
    title: session.title,
    platform: session.platform,
    caption: session.caption,
    hashtags: session.hashtags,
    renderConfig,
  });

  const { caption, hashtags, platform, title, setTitle } = session;

  const handleSave = useCallback(async () => {
    const outcome = await draftBinding.save({
      code,
      language,
      config: RenderConfig.fromSnapshot(renderConfig),
      caption,
      hashtags,
      platform,
      title,
    });
    if (outcome.kind === 'saved') {
      setTitle(outcome.snapshot.title);
    }
  }, [draftBinding, code, language, renderConfig, caption, hashtags, platform, title, setTitle]);

  const handleFlush = useCallback(() => {
    void draftBinding.flush();
  }, [draftBinding]);

  const handleOpenDraft = useCallback(
    async (id: DraftId) => {
      await draftBinding.open(id);
      setOpenSeq((n) => n + 1);
      setView('editor');
    },
    [draftBinding],
  );

  const handleNewDraft = useCallback(async () => {
    await draftBinding.unbind();
    session.resetToDefault(prefs.defaultPlatform);
    setCode('');
    resetLanguage();
    setView('editor');
  }, [draftBinding, session, prefs.defaultPlatform, setCode, resetLanguage]);

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
              title={session.title}
              onTitleChange={session.setTitle}
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
              title={session.title}
              platform={session.platform}
              onPlatformChange={session.setPlatform}
              canvasRef={canvasRef}
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
            <ConfigColumn
              renderConfig={renderConfig}
              patchConfig={patchConfig}
              defaultPlatform={prefs.defaultPlatform}
              onDefaultPlatformChange={(platform) => {
                patchPrefs({ defaultPlatform: platform });
              }}
            />
          </div>
          <CaptionBar
            caption={session.caption}
            hashtags={session.hashtags}
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
