import type { ExportFormat, ExportScale } from '@/domain/rendering/RenderConfig';

export interface ImageExportOptions {
  readonly scale: ExportScale;
  readonly format: ExportFormat;
}

export type ExportImageOutcome =
  | { readonly kind: 'exported'; readonly blob: Blob }
  | { readonly kind: 'rasterization_failed'; readonly cause: unknown }
  | { readonly kind: 'malformed_data_url'; readonly cause: unknown };

export interface ImageExporter {
  export(target: HTMLElement, options: ImageExportOptions): Promise<ExportImageOutcome>;
}
