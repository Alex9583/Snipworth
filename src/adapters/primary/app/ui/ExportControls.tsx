import {
  exportFormats,
  exportScales,
  type ExportFormat,
  type ExportScale,
} from '@/domain/rendering/RenderConfig';
import { EXPORT_CONTROLS } from './ExportControls.strings';
import { Button } from './Button';
import { Card } from './Card';
import { Segmented, type SegmentedOption } from './Segmented';

interface ExportControlsProps {
  readonly baseWidth?: number;
  readonly baseHeight?: number;
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
  baseWidth,
  baseHeight,
  scale,
  format,
  onScaleChange,
  onFormatChange,
  onCopy,
  onDownload,
}: ExportControlsProps) {
  const hasDimensions = baseWidth !== undefined && baseHeight !== undefined;
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <FieldLabel>{EXPORT_CONTROLS.formatLabel}</FieldLabel>
        <Segmented
          label={EXPORT_CONTROLS.formatLabel}
          value={format}
          options={FORMAT_OPTIONS}
          onChange={onFormatChange}
        />
        <FieldLabel>{EXPORT_CONTROLS.qualityLabel}</FieldLabel>
        <Segmented
          label={EXPORT_CONTROLS.qualityLabel}
          value={scale}
          options={SCALE_OPTIONS}
          onChange={onScaleChange}
        />
      </div>
      {hasDimensions && (
        <p className="text-ink-muted font-mono text-xs">
          {EXPORT_CONTROLS.estimatedSize(
            Math.round(baseWidth * scale),
            Math.round(baseHeight * scale),
          )}
        </p>
      )}
      <div className="flex gap-2">
        <Button onClick={onCopy} size="sm">
          {EXPORT_CONTROLS.copyButton}
        </Button>
        <Button onClick={onDownload} size="sm" variant="outline">
          {EXPORT_CONTROLS.downloadButton}
        </Button>
      </div>
    </Card>
  );
}

function FieldLabel({ children }: { readonly children: string }) {
  return <span className="text-ink-muted text-xs">{children}</span>;
}
