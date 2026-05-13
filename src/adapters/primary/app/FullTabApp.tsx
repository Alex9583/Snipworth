import {
  Activity,
  type ReactNode,
  Suspense,
  useDeferredValue,
  useMemo,
  useRef,
  useState,
} from 'react';

import { AboutView } from './AboutView';
import type { AppDependencies } from './AppDependencies';
import { ErrorBanner } from './ErrorBanner';
import { FULL_TAB_APP } from './FullTabApp.strings';
import type { FullTabView } from './FullTabView';
import { HighlightedPreview } from './HighlightedPreview';
import { LiveCodeEditor } from './LiveCodeEditor';
import { OnboardingRequiredNotice } from './OnboardingRequiredNotice';
import { APP } from './app.strings';
import { createHighlightCache } from './highlightCache';
import { solidBackgroundCss } from './previewBackground';
import { ConfigPanel } from './ui/ConfigPanel';
import { EditorStats } from './ui/EditorStats';
import { ExportControls } from './ui/ExportControls';
import { copyStatusLabel, downloadStatusLabel } from './ui/ExportControls.strings';
import { LanguagePicker } from './ui/LanguagePicker';
import { CodeIcon, EyeIcon, SettingsIcon } from './ui/icons';
import { TabTopNav } from './ui/TabTopNav';
import { useEditorLanguageState } from './useEditorLanguageState';
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
}: AppDependencies) {
  const [view, setView] = useState<FullTabView>('editor');
  const previewRef = useRef<HTMLDivElement>(null);

  const { code, setCode, language, detection, pickLanguage } = useEditorLanguageState(
    fullTabBootstrapInbox,
    loadCapturedCode,
    autoDetectLanguage,
  );

  const { prefs, hasLoaded, renderConfig, patchConfig } = useUserPreferences(
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

  if (!hasLoaded) {
    return null;
  }

  if (!prefs.onboardingCompleted) {
    return <OnboardingRequiredNotice />;
  }

  return (
    <div className="bg-canvas text-ink flex h-screen flex-col">
      <TabTopNav activeView={view} onChangeView={setView} />

      <Activity mode={view === 'editor' ? 'visible' : 'hidden'}>
        <main className="flex min-h-0 flex-1 flex-col">
          <ErrorBanner reader={errorReader} acknowledger={errorAcknowledger} />
          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
            <section
              aria-labelledby="code-column-heading"
              className="border-line flex min-h-96 flex-col border-b max-lg:max-h-[60vh] lg:min-h-0 lg:w-1/4 lg:min-w-65 lg:border-r lg:border-b-0"
            >
              <ColumnHeader
                id="code-column-heading"
                icon={<CodeIcon size={14} />}
                label={FULL_TAB_APP.codeColumnLabel}
                slot={
                  <LanguagePicker value={language} detection={detection} onChange={pickLanguage} />
                }
              />
              <div className="min-h-0 flex-1 p-3">
                <LiveCodeEditor
                  value={code}
                  onChange={setCode}
                  language={language}
                  theme={renderConfig.theme}
                  fontSize={renderConfig.fontSize}
                  getHighlight={getHighlight}
                  label={FULL_TAB_APP.codeColumnLabel}
                  placeholder={APP.codePlaceholder}
                  className="h-full"
                />
              </div>
              <div className="border-line border-t px-4 py-2">
                <EditorStats code={code} />
              </div>
            </section>

            <section
              aria-labelledby="preview-column-heading"
              className="border-line flex min-h-96 flex-1 flex-col border-b max-lg:max-h-[70vh] lg:min-h-0 lg:border-r lg:border-b-0"
            >
              <ColumnHeader
                id="preview-column-heading"
                icon={<EyeIcon size={14} />}
                label={FULL_TAB_APP.previewColumnLabel}
              />
              <Suspense
                fallback={
                  <div className="flex min-h-0 flex-1 items-center justify-center">
                    <p className="text-ink-muted">{APP.previewLoading}</p>
                  </div>
                }
              >
                <div className="min-h-0 flex-1 overflow-auto p-6">
                  <div className="flex min-h-full items-center justify-center">
                    <HighlightedPreview
                      ref={previewRef}
                      getHighlight={getHighlight}
                      code={deferredCode}
                      language={language}
                      theme={renderConfig.theme}
                      fontFamily={renderConfig.fontFamily}
                      fontSize={renderConfig.fontSize}
                      background={solidBackgroundCss(renderConfig.background)}
                      className="w-full max-w-2xl"
                    />
                  </div>
                </div>
                <div className="border-line bg-surface border-t p-3">
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
            </section>

            <section
              aria-labelledby="config-column-heading"
              className="flex min-h-96 flex-col max-lg:max-h-[60vh] lg:min-h-0 lg:w-1/4 lg:min-w-65"
            >
              <ColumnHeader
                id="config-column-heading"
                icon={<SettingsIcon size={14} />}
                label={FULL_TAB_APP.configColumnLabel}
              />
              <div className="min-h-0 flex-1 overflow-auto px-4 pb-4">
                <ConfigPanel value={renderConfig} onChange={patchConfig} />
              </div>
            </section>
          </div>
        </main>
      </Activity>

      <Activity mode={view === 'about' ? 'visible' : 'hidden'}>
        <AboutView />
      </Activity>
    </div>
  );
}

interface ColumnHeaderProps {
  readonly id: string;
  readonly icon: ReactNode;
  readonly label: string;
  readonly slot?: ReactNode;
}

function ColumnHeader({ id, icon, label, slot }: ColumnHeaderProps) {
  return (
    <div className="border-line flex items-center justify-between gap-2 border-b px-4 py-3">
      <h2 id={id} className="text-ink flex items-center gap-2 text-sm font-semibold">
        <span className="text-ink-muted">{icon}</span>
        {label}
      </h2>
      {slot !== undefined && <div>{slot}</div>}
    </div>
  );
}
