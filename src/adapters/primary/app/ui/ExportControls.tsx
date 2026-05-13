import {
  exportFormats,
  exportScales,
  type ExportFormat,
  type ExportScale,
} from '@/domain/rendering/RenderConfig';
import { Button } from './Button';
import { CopyIcon, DownloadIcon } from './icons';
import { IconBtn } from './IconBtn';
import { EXPORT_CONTROLS } from './ExportControls.strings';
import { Segmented, type SegmentedOption } from './Segmented';

interface ExportControlsProps {
  readonly scale: ExportScale;
  readonly format: ExportFormat;
  readonly onScaleChange: (scale: ExportScale) => void;
  readonly onFormatChange: (format: ExportFormat) => void;
  readonly onCopy: () => void;
  readonly onDownload: () => void;
}

const FORMAT_OPTIONS: readonly SegmentedOption<ExportFormat>[] = exportFormats.map((value) => ({
  value,
  label: value.toUpperCase(),
}));

const SCALE_OPTIONS: readonly SegmentedOption<ExportScale>[] = exportScales.map((value) => ({
  value,
  label: `${String(value)}×`,
}));

export function ExportControls({
  scale,
  format,
  onScaleChange,
  onFormatChange,
  onCopy,
  onDownload,
}: ExportControlsProps) {
  return (
    <div className="@container border-line bg-surface flex items-center justify-between gap-1.5 rounded-lg border px-1.5 py-2 @[380px]:gap-2 @[380px]:px-2.5">
      <div className="flex items-center gap-1 @[380px]:gap-1.5">
        <Segmented
          label={EXPORT_CONTROLS.formatLabel}
          value={format}
          options={FORMAT_OPTIONS}
          onChange={onFormatChange}
        />
        <Segmented
          label={EXPORT_CONTROLS.qualityLabel}
          value={scale}
          options={SCALE_OPTIONS}
          onChange={onScaleChange}
        />
      </div>
      <div className="flex items-center gap-1">
        <IconBtn label={EXPORT_CONTROLS.copyButton} onClick={onCopy}>
          <CopyIcon size={14} />
        </IconBtn>
        <Button onClick={onDownload} size="sm" iconLeft={<DownloadIcon size={13} />}>
          {EXPORT_CONTROLS.downloadButton}
        </Button>
      </div>
    </div>
  );
}
