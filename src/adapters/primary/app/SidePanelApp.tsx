import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';

import { SaveDraftButton } from '@/adapters/primary/library/SaveDraftButton';
import { SaveDraftToast } from '@/adapters/primary/library/SaveDraftToast';
import { useDraftAutoSync } from '@/adapters/primary/library/useDraftAutoSync';
import { toSaveBinding, useDraftBinding } from '@/adapters/primary/library/useDraftBinding';
import { RenderConfig } from '@/domain/rendering/RenderConfig';

import type { AppDependencies } from './AppDependencies';
import { ErrorBanner } from './ErrorBanner';
import { Onboarding } from './onboarding/Onboarding';
import { SidePanelCodeTab } from './SidePanelCodeTab';
import { SidePanelPreviewTab } from './SidePanelPreviewTab';
import { APP } from './app.strings';
import { SIDE_PANEL_APP } from './SidePanelApp.strings';
import { createHighlightCache } from './highlightCache';
import { AppFooter } from './ui/AppFooter';
import { AppHeader } from './ui/AppHeader';
import { ConfigPanel } from './ui/ConfigPanel';
import { CodeIcon, EyeIcon, SettingsIcon } from './ui/icons';
import { Tabs } from './ui/Tabs';
import { useEditorLanguageState } from './useEditorLanguageState';
import { useEditorSession } from './useEditorSession';
import { useOpenFullTabAction } from './useOpenFullTabAction';
import { useSnippetExportHandles } from './useSnippetExportHandles';
import { useUserPreferences } from './useUserPreferences';

type TabValue = 'code' | 'preview' | 'config';

export function SidePanelApp({
  errorReader,
  errorAcknowledger,
  reportSidePanelFailure,
  copySnippetAsImage,
  downloadSnippetAsImage,
  loadCapturedCode,
  autoDetectLanguage,
  captureInbox,
  syntaxHighlighter,
  userPreferencesStore,
  openFullTabEditor,
  clock,
  saveDraft,
  openDraft,
  updateDraft,
}: AppDependencies) {
  const [activeTab, setActiveTab] = useState<TabValue>('code');
  const [toastVisible, setToastVisible] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const { code, setCode, language, detection, pickLanguage, requestAutoDetection } =
    useEditorLanguageState(captureInbox, loadCapturedCode, autoDetectLanguage);

  const { prefs, hasLoaded, renderConfig, patchConfig, patchPrefs, completeOnboarding } =
    useUserPreferences(userPreferencesStore, reportSidePanelFailure);

  const draftBinding = useDraftBinding({
    saveUseCase: saveDraft,
    openUseCase: openDraft,
    updateUseCase: updateDraft,
  });

  const session = useEditorSession({ initialPlatform: prefs.defaultPlatform });

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

  const onOpenFullTab = useOpenFullTabAction(openFullTabEditor, code, (outcome) => {
    if (outcome.kind === 'opened') return;
    void reportSidePanelFailure.execute({
      kind: 'open_full_tab_failed',
      message: APP.openFullTabFailedMessage,
      cause: outcome.cause,
    });
  });

  const { caption, hashtags, platform, title, setTitle, setPlatform } = session;

  useEffect(() => {
    if (draftBinding.binding.kind === 'scratch') {
      setPlatform(prefs.defaultPlatform);
    }
  }, [prefs.defaultPlatform, draftBinding.binding.kind, setPlatform]);

  useDraftAutoSync(draftBinding, { code, language, title, renderConfig });

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
      setToastVisible(true);
    }
  }, [draftBinding, code, language, renderConfig, caption, hashtags, platform, title, setTitle]);

  const handleFlush = useCallback(() => {
    void draftBinding.flush();
  }, [draftBinding]);

  const saveBinding = toSaveBinding(draftBinding.binding);
  const modKey: 'mac' | 'pc' = navigator.platform.includes('Mac') ? 'mac' : 'pc';

  const saveDraftSlot = (
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
      onShowSavedToast={() => {
        setToastVisible(true);
      }}
    />
  );

  if (!hasLoaded) {
    return null;
  }

  if (!prefs.onboardingCompleted) {
    return (
      <div className="bg-canvas text-ink flex h-screen flex-col">
        <AppHeader onOpenFullTab={onOpenFullTab} />
        <Onboarding
          onComplete={() => {
            void completeOnboarding();
          }}
        />
      </div>
    );
  }

  return (
    <div className="bg-canvas text-ink flex h-screen flex-col">
      <AppHeader onOpenFullTab={onOpenFullTab} />
      <main className="flex min-h-0 flex-1 flex-col gap-2 p-3">
        <ErrorBanner reader={errorReader} acknowledger={errorAcknowledger} />
        <Tabs
          value={activeTab}
          onChange={(next) => {
            setActiveTab(next as TabValue);
          }}
        >
          <Tabs.List className="w-full" label={SIDE_PANEL_APP.tabsLabel}>
            <Tabs.Trigger value="code" iconLeft={<CodeIcon size={13} />} className="flex-1">
              {SIDE_PANEL_APP.tabCodeLabel}
            </Tabs.Trigger>
            <Tabs.Trigger value="preview" iconLeft={<EyeIcon size={13} />} className="flex-1">
              {SIDE_PANEL_APP.tabPreviewLabel}
            </Tabs.Trigger>
            <Tabs.Trigger value="config" iconLeft={<SettingsIcon size={13} />} className="flex-1">
              {SIDE_PANEL_APP.tabConfigLabel}
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs>

        <div className="flex min-h-0 flex-1 flex-col gap-2">
          {activeTab === 'code' && (
            <SidePanelCodeTab
              title={session.title}
              onTitleChange={session.setTitle}
              code={code}
              onCodeChange={setCode}
              language={language}
              detection={detection}
              onLanguageChange={pickLanguage}
              onAutoDetect={requestAutoDetection}
              theme={renderConfig.theme}
              fontSize={renderConfig.fontSize}
              getHighlight={getHighlight}
              saveSlot={saveDraftSlot}
            />
          )}

          {activeTab === 'preview' && (
            <SidePanelPreviewTab
              title={session.title}
              platform={session.platform}
              canvasRef={canvasRef}
              getHighlight={getHighlight}
              code={deferredCode}
              language={language}
              renderConfig={renderConfig}
              patchConfig={patchConfig}
              copyHandle={copyHandle}
              downloadHandle={downloadHandle}
            />
          )}

          {activeTab === 'config' && (
            <div className="min-h-0 flex-1 overflow-auto">
              <ConfigPanel
                value={renderConfig}
                onChange={patchConfig}
                defaultPlatform={prefs.defaultPlatform}
                onDefaultPlatformChange={(platform) => {
                  patchPrefs({ defaultPlatform: platform });
                }}
              />
            </div>
          )}
        </div>
      </main>
      <SaveDraftToast
        visible={toastVisible}
        onOpen={onOpenFullTab}
        onDismiss={() => {
          setToastVisible(false);
        }}
      />
      <AppFooter />
    </div>
  );
}
