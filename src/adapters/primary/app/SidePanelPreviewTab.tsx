import { type ReactNode, type RefObject, Suspense } from 'react';

import type { RenderConfigSnapshot } from '@/domain/rendering/RenderConfig';

import { HighlightedPreview } from './HighlightedPreview';
import { APP } from './app.strings';
import type { HighlightLookup } from './highlightCache';
import { solidBackgroundCss } from './previewBackground';
import { ExportControls } from './ui/ExportControls';
import { copyStatusLabel, downloadStatusLabel } from './ui/ExportControls.strings';
import type { CopyActionHandle } from './useCopyAction';
import type { DownloadActionHandle } from './useDownloadAction';

interface SidePanelPreviewTabProps {
  readonly title: string;
  readonly previewRef: RefObject<HTMLDivElement | null>;
  readonly getHighlight: HighlightLookup;
  readonly code: string;
  readonly language: string;
  readonly renderConfig: RenderConfigSnapshot;
  readonly patchConfig: (patch: Partial<RenderConfigSnapshot>) => void;
  readonly copyHandle: CopyActionHandle;
  readonly downloadHandle: DownloadActionHandle;
  readonly saveSlot: ReactNode;
}

export function SidePanelPreviewTab({
  title,
  previewRef,
  getHighlight,
  code,
  language,
  renderConfig,
  patchConfig,
  copyHandle,
  downloadHandle,
  saveSlot,
}: SidePanelPreviewTabProps) {
  return (
    <Suspense fallback={<p className="text-ink-muted">{APP.previewLoading}</p>}>
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="min-h-0 flex-1 overflow-auto">
          <div className="flex min-h-full items-center justify-center">
            <HighlightedPreview
              ref={previewRef}
              getHighlight={getHighlight}
              code={code}
              language={language}
              theme={renderConfig.theme}
              title={title}
              fontFamily={renderConfig.fontFamily}
              fontSize={renderConfig.fontSize}
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
          slot={saveSlot}
        />
        {copyHandle.status && <p role="status">{copyStatusLabel(copyHandle.status)}</p>}
        {downloadHandle.status && <p role="status">{downloadStatusLabel(downloadHandle.status)}</p>}
      </div>
    </Suspense>
  );
}
