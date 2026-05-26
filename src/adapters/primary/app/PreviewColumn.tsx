import { type ReactNode, type RefObject, Suspense } from 'react';

import { PlatformRow } from '@/adapters/primary/library/PlatformRow';
import type { Platform } from '@/domain/drafts/Platform';
import {
  pixelDimensionsForPlatform,
  type PixelDimensions,
} from '@/domain/drafts/pixelDimensionsForPlatform';
import type { RenderConfigSnapshot } from '@/domain/rendering/RenderConfig';

import { FULL_TAB_APP } from './FullTabApp.strings';
import { HighlightedPreview } from './HighlightedPreview';
import { APP } from './app.strings';
import type { HighlightLookup } from './highlightCache';
import { backgroundCss } from './previewBackground';
import { ExportCanvas } from './ui/ExportCanvas';
import { ExportControls } from './ui/ExportControls';
import { copyStatusLabel, downloadStatusLabel } from './ui/ExportControls.strings';
import type { CopyActionHandle } from './useCopyAction';
import type { DownloadActionHandle } from './useDownloadAction';

interface PreviewColumnProps {
  readonly title: string;
  readonly platform: Platform;
  readonly onPlatformChange: (next: Platform) => void;
  readonly canvasRef: RefObject<HTMLDivElement | null>;
  readonly getHighlight: HighlightLookup;
  readonly code: string;
  readonly language: string;
  readonly renderConfig: RenderConfigSnapshot;
  readonly patchConfig: (patch: Partial<RenderConfigSnapshot>) => void;
  readonly copyHandle: CopyActionHandle;
  readonly downloadHandle: DownloadActionHandle;
  readonly saveSlot: ReactNode;
}

export function PreviewColumn({
  title,
  platform,
  onPlatformChange,
  canvasRef,
  getHighlight,
  code,
  language,
  renderConfig,
  patchConfig,
  copyHandle,
  downloadHandle,
  saveSlot,
}: PreviewColumnProps) {
  const dimensions = pixelDimensionsForPlatform(platform);
  return (
    <section
      aria-labelledby="preview-column-heading"
      className="border-line flex min-h-96 flex-1 flex-col border-b max-lg:max-h-[70vh] lg:min-h-0 lg:border-r lg:border-b-0"
    >
      <div className="border-line flex items-center gap-3 border-b px-4 py-3">
        <h2 id="preview-column-heading" className="sr-only">
          {FULL_TAB_APP.previewColumnLabel}
        </h2>
        <PlatformRow currentPlatform={platform} onPlatformChange={onPlatformChange} />
      </div>
      <Suspense
        fallback={
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <p className="text-ink-muted">{APP.previewLoading}</p>
          </div>
        }
      >
        <PreviewPane
          title={title}
          canvasRef={canvasRef}
          dimensions={dimensions}
          getHighlight={getHighlight}
          code={code}
          language={language}
          renderConfig={renderConfig}
        />
        <ExportBar
          renderConfig={renderConfig}
          patchConfig={patchConfig}
          copyHandle={copyHandle}
          downloadHandle={downloadHandle}
          saveSlot={saveSlot}
        />
      </Suspense>
    </section>
  );
}

interface PreviewPaneProps {
  readonly title: string;
  readonly canvasRef: RefObject<HTMLDivElement | null>;
  readonly dimensions: PixelDimensions;
  readonly getHighlight: HighlightLookup;
  readonly code: string;
  readonly language: string;
  readonly renderConfig: RenderConfigSnapshot;
}

function PreviewPane({
  title,
  canvasRef,
  dimensions,
  getHighlight,
  code,
  language,
  renderConfig,
}: PreviewPaneProps) {
  if (dimensions.kind === 'auto') {
    return (
      <div className="min-h-0 flex-1 overflow-auto p-6">
        <div className="flex min-h-full items-center justify-center">
          <HighlightedPreview
            ref={canvasRef}
            getHighlight={getHighlight}
            code={code}
            language={language}
            theme={renderConfig.theme}
            title={title}
            titleColor={renderConfig.titleColor}
            titleFontSize={renderConfig.titleFontSize}
            fontFamily={renderConfig.fontFamily}
            fontSize={renderConfig.fontSize}
            background={backgroundCss(renderConfig.background)}
            className="w-full max-w-2xl"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto p-6">
      <div className="flex min-h-full items-center justify-center">
        <ExportCanvas
          ref={canvasRef}
          dimensions={dimensions}
          canvasBackground={backgroundCss(renderConfig.canvasBackground)}
          canvasPadding={renderConfig.canvasPadding}
        >
          <HighlightedPreview
            getHighlight={getHighlight}
            code={code}
            language={language}
            theme={renderConfig.theme}
            title={title}
            titleColor={renderConfig.titleColor}
            titleFontSize={renderConfig.titleFontSize}
            fontFamily={renderConfig.fontFamily}
            fontSize={renderConfig.fontSize}
            background={backgroundCss(renderConfig.background)}
          />
        </ExportCanvas>
      </div>
    </div>
  );
}

interface ExportBarProps {
  readonly renderConfig: RenderConfigSnapshot;
  readonly patchConfig: (patch: Partial<RenderConfigSnapshot>) => void;
  readonly copyHandle: CopyActionHandle;
  readonly downloadHandle: DownloadActionHandle;
  readonly saveSlot: ReactNode;
}

function ExportBar({
  renderConfig,
  patchConfig,
  copyHandle,
  downloadHandle,
  saveSlot,
}: ExportBarProps) {
  return (
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
        slot={saveSlot}
      />
      {copyHandle.status && <p role="status">{copyStatusLabel(copyHandle.status)}</p>}
      {downloadHandle.status && <p role="status">{downloadStatusLabel(downloadHandle.status)}</p>}
    </div>
  );
}
