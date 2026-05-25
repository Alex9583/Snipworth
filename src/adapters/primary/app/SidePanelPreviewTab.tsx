import { type RefObject, Suspense } from 'react';

import type { Platform } from '@/domain/drafts/Platform';
import { pixelDimensionsForPlatform } from '@/domain/drafts/pixelDimensionsForPlatform';
import type { RenderConfigSnapshot } from '@/domain/rendering/RenderConfig';

import { HighlightedPreview } from './HighlightedPreview';
import { APP } from './app.strings';
import type { HighlightLookup } from './highlightCache';
import { backgroundCss } from './previewBackground';
import { ExportCanvas } from './ui/ExportCanvas';
import { ExportControls } from './ui/ExportControls';
import { copyStatusLabel, downloadStatusLabel } from './ui/ExportControls.strings';
import type { CopyActionHandle } from './useCopyAction';
import type { DownloadActionHandle } from './useDownloadAction';

interface SidePanelPreviewTabProps {
  readonly title: string;
  readonly platform: Platform;
  readonly canvasRef: RefObject<HTMLDivElement | null>;
  readonly getHighlight: HighlightLookup;
  readonly code: string;
  readonly language: string;
  readonly renderConfig: RenderConfigSnapshot;
  readonly patchConfig: (patch: Partial<RenderConfigSnapshot>) => void;
  readonly copyHandle: CopyActionHandle;
  readonly downloadHandle: DownloadActionHandle;
}

export function SidePanelPreviewTab({
  title,
  platform,
  canvasRef,
  getHighlight,
  code,
  language,
  renderConfig,
  patchConfig,
  copyHandle,
  downloadHandle,
}: SidePanelPreviewTabProps) {
  const dimensions = pixelDimensionsForPlatform(platform);

  return (
    <Suspense fallback={<p className="text-ink-muted">{APP.previewLoading}</p>}>
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="min-h-0 flex-1 overflow-auto">
          <div className="flex min-h-full items-center justify-center">
            {dimensions.kind === 'auto' ? (
              <HighlightedPreview
                ref={canvasRef}
                getHighlight={getHighlight}
                code={code}
                language={language}
                theme={renderConfig.theme}
                title={title}
                fontFamily={renderConfig.fontFamily}
                fontSize={renderConfig.fontSize}
                background={backgroundCss(renderConfig.background)}
                className="w-full"
              />
            ) : (
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
                  fontFamily={renderConfig.fontFamily}
                  fontSize={renderConfig.fontSize}
                  background={backgroundCss(renderConfig.background)}
                />
              </ExportCanvas>
            )}
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
        {downloadHandle.status && <p role="status">{downloadStatusLabel(downloadHandle.status)}</p>}
      </div>
    </Suspense>
  );
}
