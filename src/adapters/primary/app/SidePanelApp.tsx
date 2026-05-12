import { Suspense, useDeferredValue, useMemo, useRef, useState } from 'react';

import type { AppDependencies } from './AppDependencies';
import { ErrorBanner } from './ErrorBanner';
import { HighlightedPreview } from './HighlightedPreview';
import { LiveCodeEditor } from './LiveCodeEditor';
import { Onboarding } from './onboarding/Onboarding';
import { createHighlightCache } from './highlightCache';
import { APP } from './app.strings';
import { SIDE_PANEL_APP } from './SidePanelApp.strings';
import { solidBackgroundCss } from './previewBackground';
import { copyStatusLabel, downloadStatusLabel } from './ui/ExportControls.strings';
import { AppFooter } from './ui/AppFooter';
import { AppHeader } from './ui/AppHeader';
import { ConfigPanel } from './ui/ConfigPanel';
import { EditorStats } from './ui/EditorStats';
import { ExportControls } from './ui/ExportControls';
import { LanguagePicker } from './ui/LanguagePicker';
import { CodeIcon, EyeIcon, SettingsIcon } from './ui/icons';
import { Tabs } from './ui/Tabs';
import { useEditorLanguageState } from './useEditorLanguageState';
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
}: AppDependencies) {
  const [activeTab, setActiveTab] = useState<TabValue>('code');
  const previewRef = useRef<HTMLDivElement>(null);

  const { code, setCode, language, detection, pickLanguage } = useEditorLanguageState(
    captureInbox,
    loadCapturedCode,
    autoDetectLanguage,
  );

  const { prefs, hasLoaded, renderConfig, patchConfig, completeOnboarding } = useUserPreferences(
    userPreferencesStore,
    reportSidePanelFailure,
  );

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
  const onOpenFullTab = useOpenFullTabAction(openFullTabEditor, code, (outcome) => {
    if (outcome.kind === 'opened') return;
    void reportSidePanelFailure.execute({
      kind: 'open_full_tab_failed',
      message: APP.openFullTabFailedMessage,
      cause: outcome.cause,
    });
  });

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
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <LiveCodeEditor
                value={code}
                onChange={setCode}
                language={language}
                theme={renderConfig.theme}
                getHighlight={getHighlight}
                label={SIDE_PANEL_APP.tabCodeLabel}
                placeholder={APP.codePlaceholder}
                className="flex-1"
                topRightSlot={
                  <LanguagePicker value={language} detection={detection} onChange={pickLanguage} />
                }
              />
              <EditorStats code={code} />
            </div>
          )}

          {activeTab === 'preview' && (
            <Suspense fallback={<p className="text-ink-muted">{APP.previewLoading}</p>}>
              <div className="flex min-h-0 flex-1 flex-col gap-2">
                <div className="min-h-0 flex-1 overflow-auto">
                  <div className="flex min-h-full items-center justify-center">
                    <HighlightedPreview
                      ref={previewRef}
                      getHighlight={getHighlight}
                      code={deferredCode}
                      language={language}
                      theme={renderConfig.theme}
                      fontFamily={renderConfig.fontFamily}
                      background={solidBackgroundCss(renderConfig.background)}
                      className="w-full"
                    />
                  </div>
                </div>
                <ExportControls
                  scale={renderConfig.exportScale}
                  format={renderConfig.exportFormat}
                  onScaleChange={(scale) => {
                    patchConfig({ exportScale: scale });
                  }}
                  onFormatChange={(format) => {
                    patchConfig({ exportFormat: format });
                  }}
                  onCopy={copyHandle.onCopy}
                  onDownload={downloadHandle.onDownload}
                />
                {copyHandle.status && <p role="status">{copyStatusLabel(copyHandle.status)}</p>}
                {downloadHandle.status && (
                  <p role="status">{downloadStatusLabel(downloadHandle.status)}</p>
                )}
              </div>
            </Suspense>
          )}

          {activeTab === 'config' && (
            <div className="min-h-0 flex-1 overflow-auto">
              <ConfigPanel value={renderConfig} onChange={patchConfig} />
            </div>
          )}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
