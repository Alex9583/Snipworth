import type { ExportFormat } from '@/domain/rendering/RenderConfig';

const ISO_DATETIME_LENGTH = 19;

export function buildExportFilename(at: Date, format: ExportFormat): string {
  const iso = at.toISOString().slice(0, ISO_DATETIME_LENGTH).replace(/[T:]/g, '-');
  return `snipworth-${iso}.${format}`;
}
