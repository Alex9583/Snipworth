import { Suspense, useDeferredValue, useMemo, useRef, useState } from 'react';

import type { CopySnippetOutcome } from '@/application/use-cases/CopySnippetAsImage';
import type { DownloadSnippetOutcome } from '@/application/use-cases/DownloadSnippetAsImage';
import type { Background } from '@/domain/rendering/RenderConfig';

import type { AppDependencies } from './AppDependencies';
import type { AppMode } from './AppMode';
import { ErrorBanner } from './ErrorBanner';
import { HighlightedPreview } from './HighlightedPreview';
import { LiveCodeEditor } from './LiveCodeEditor';
import { createHighlightCache } from './highlightCache';
import { APP } from './app.strings';
import { EXPORT_CONTROLS, copyStatusLabel, downloadStatusLabel } from './ui/ExportControls.strings';
import { AppFooter } from './ui/AppFooter';
import { AppHeader } from './ui/AppHeader';
import { ConfigPanel } from './ui/ConfigPanel';
import { EditorStats } from './ui/EditorStats';
import { ExportControls } from './ui/ExportControls';
import { LanguagePicker } from './ui/LanguagePicker';
import { CodeIcon, EyeIcon, SettingsIcon } from './ui/icons';
import { Tabs } from './ui/Tabs';
import { useEditorLanguageState } from './useEditorLanguageState';
import { useCopyAction } from './useCopyAction';
import { useDownloadAction } from './useDownloadAction';
import { useOpenFullTabAction } from './useOpenFullTabAction';
import { useUserPreferences } from './useUserPreferences';

type AppProps = AppDependencies & { readonly mode: AppMode };

type TabValue = 'code' | 'preview' | 'config';

const FALLBACK_BACKGROUND_CSS = '#1C1C21';
const CODE_PLACEHOLDER = 'Paste or type code…';

export function App({
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
  fullTabOpener,
  clock,
  mode,
}: AppProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('code');
  const previewRef = useRef<HTMLDivElement>(null);

  const { code, setCode, language, detection, pickLanguage } = useEditorLanguageState(
    captureInbox,
    loadCapturedCode,
    autoDetectLanguage,
  );

  const { renderConfig, patchConfig } = useUserPreferences(
    userPreferencesStore,
    reportSidePanelFailure,
  );

  const deferredCode = useDeferredValue(code);

  const getHighlight = useMemo(() => createHighlightCache(syntaxHighlighter), [syntaxHighlighter]);

  const onCopyOutcome = (outcome: CopySnippetOutcome): void => {
    if (outcome.kind === 'copied') return;
    void reportSidePanelFailure.execute({
      kind: 'snippet_export_failed',
      message: EXPORT_CONTROLS.copyExportFailedMessage,
      cause: 'cause' in outcome ? outcome.cause : undefined,
    });
  };

  const onDownloadOutcome = (outcome: DownloadSnippetOutcome): void => {
    if (outcome.kind === 'downloaded') return;
    void reportSidePanelFailure.execute({
      kind: 'snippet_export_failed',
      message: EXPORT_CONTROLS.downloadExportFailedMessage,
      cause: 'cause' in outcome ? outcome.cause : undefined,
    });
  };

  const copyHandle = useCopyAction(
    copySnippetAsImage,
    previewRef,
    renderConfig.fontFamily,
    onCopyOutcome,
  );
  const downloadHandle = useDownloadAction(
    downloadSnippetAsImage,
    previewRef,
    renderConfig.fontFamily,
    renderConfig.exportFormat,
    clock,
    onDownloadOutcome,
  );
  const onOpenFullTab = useOpenFullTabAction(fullTabOpener, (outcome) => {
    if (outcome.kind === 'opened') return;
    void reportSidePanelFailure.execute({
      kind: 'open_full_tab_failed',
      message: APP.openFullTabFailedMessage,
      cause: outcome.cause,
    });
  });

  return (
    <div className="bg-canvas text-ink flex h-screen flex-col">
      <AppHeader mode={mode} onOpenFullTab={onOpenFullTab} />
      <main className="flex min-h-0 flex-1 flex-col gap-2 p-3">
        <ErrorBanner reader={errorReader} acknowledger={errorAcknowledger} />
        <Tabs
          value={activeTab}
          onChange={(next) => {
            setActiveTab(next as TabValue);
          }}
        >
          <Tabs.List className="w-full">
            <Tabs.Trigger value="code" iconLeft={<CodeIcon size={13} />} className="flex-1">
              {APP.tabCodeLabel}
            </Tabs.Trigger>
            <Tabs.Trigger value="preview" iconLeft={<EyeIcon size={13} />} className="flex-1">
              {APP.tabPreviewLabel}
            </Tabs.Trigger>
            <Tabs.Trigger value="config" iconLeft={<SettingsIcon size={13} />} className="flex-1">
              {APP.tabConfigLabel}
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
                label={APP.tabCodeLabel}
                placeholder={CODE_PLACEHOLDER}
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

function solidBackgroundCss(background: Background): string {
  return background.type === 'solid' ? background.color : FALLBACK_BACKGROUND_CSS;
}
