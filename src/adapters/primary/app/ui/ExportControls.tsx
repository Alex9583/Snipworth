import {
  exportFormats,
  exportScales,
  type ExportFormat,
  type ExportScale,
} from '@/domain/rendering/RenderConfig';
import { Button } from './Button';
import { Card } from './Card';
import { Segmented, type SegmentedOption } from './Segmented';

interface ExportControlsProps {
  readonly baseWidth: number;
  readonly baseHeight: number;
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
  const exportWidth = Math.round(baseWidth * scale);
  const exportHeight = Math.round(baseHeight * scale);
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <FieldLabel>Format</FieldLabel>
        <Segmented
          label="Format"
          value={format}
          options={FORMAT_OPTIONS}
          onChange={onFormatChange}
        />
        <FieldLabel>Quality</FieldLabel>
        <Segmented label="Quality" value={scale} options={SCALE_OPTIONS} onChange={onScaleChange} />
      </div>
      <p className="text-ink-muted font-mono text-xs">
        Estimated: {exportWidth} × {exportHeight} px
      </p>
      <div className="flex gap-2">
        <Button onClick={onCopy} size="sm">
          Copy image
        </Button>
        <Button onClick={onDownload} size="sm" variant="outline">
          Download
        </Button>
      </div>
    </Card>
  );
}

function FieldLabel({ children }: { readonly children: string }) {
  return <span className="text-ink-muted text-xs">{children}</span>;
}
