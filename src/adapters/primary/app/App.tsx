import { Suspense, useDeferredValue, useMemo, useRef } from 'react';

import type { CopySnippetOutcome } from '@/application/use-cases/CopySnippetAsImage';
import type { DownloadSnippetOutcome } from '@/application/use-cases/DownloadSnippetAsImage';
import type { Background } from '@/domain/rendering/RenderConfig';

import type { AppDependencies } from './AppDependencies';
import type { AppMode } from './AppMode';
import { ErrorBanner } from './ErrorBanner';
import { HighlightedPreview } from './HighlightedPreview';
import { createHighlightCache } from './highlightCache';
import { APP, appBootLabel } from './app.strings';
import { EXPORT_CONTROLS, copyStatusLabel, downloadStatusLabel } from './ui/ExportControls.strings';
import { CodeInput } from './ui/CodeInput';
import { ConfigPanel } from './ui/ConfigPanel';
import { ExportControls } from './ui/ExportControls';
import { LanguagePicker } from './ui/LanguagePicker';
import { useCapturedCode } from './useCapturedCode';
import { useCopyAction } from './useCopyAction';
import { useDownloadAction } from './useDownloadAction';
import { usePreviewSize } from './usePreviewSize';
import { useUserPreferences } from './useUserPreferences';

type AppProps = AppDependencies & { readonly mode: AppMode };

const FALLBACK_BACKGROUND_CSS = '#1C1C21';

export function App({
  mode,
  errorReader,
  errorAcknowledger,
  reportSidePanelFailure,
  copySnippetAsImage,
  downloadSnippetAsImage,
  loadCapturedCode,
  captureInbox,
  syntaxHighlighter,
  userPreferencesStore,
  clock,
}: AppProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const previewSize = usePreviewSize(previewRef);

  const { code, setCode, language, detection, pickLanguage } = useCapturedCode(
    captureInbox,
    loadCapturedCode,
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

  return (
    <main className="flex min-h-screen flex-col gap-4 p-4">
      <ErrorBanner reader={errorReader} acknowledger={errorAcknowledger} />
      <p className="text-ink-muted">{appBootLabel(mode)}</p>

      <div className="grid gap-4 md:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-2">
          <LanguagePicker value={language} detection={detection} onChange={pickLanguage} />
          <CodeInput
            value={code}
            onChange={setCode}
            label="Code"
            placeholder="Paste or type code…"
          />
        </div>
        <ConfigPanel value={renderConfig} onChange={patchConfig} />
      </div>

      <Suspense fallback={<p className="text-ink-muted">{APP.previewLoading}</p>}>
        <HighlightedPreview
          ref={previewRef}
          getHighlight={getHighlight}
          code={deferredCode}
          language={language}
          theme={renderConfig.theme}
          fontFamily={renderConfig.fontFamily}
          paddingX={renderConfig.paddingX}
          paddingY={renderConfig.paddingY}
          background={solidBackgroundCss(renderConfig.background)}
        />
      </Suspense>

      <ExportControls
        baseWidth={previewSize?.width}
        baseHeight={previewSize?.height}
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
      {downloadHandle.status && <p role="status">{downloadStatusLabel(downloadHandle.status)}</p>}
    </main>
  );
}

function solidBackgroundCss(background: Background): string {
  return background.type === 'solid' ? background.color : FALLBACK_BACKGROUND_CSS;
}
