import type { BlobDownloader, DownloadOutcome } from '@/application/ports/BlobDownloader';
import type { FontPreloader } from '@/application/ports/FontPreloader';
import type { ImageExporter } from '@/application/ports/ImageExporter';
import type { ExportFormat, ExportScale, FontFamily } from '@/domain/rendering/RenderConfig';

export interface DownloadImageOptions {
  readonly fontFamily: FontFamily;
  readonly scale: ExportScale;
  readonly format: ExportFormat;
  readonly filename: string;
}

export type DownloadSnippetOutcome =
  | DownloadOutcome
  | { readonly kind: 'export_failed'; readonly cause: unknown };

export class DownloadSnippetAsImage {
  constructor(
    private readonly fontPreloader: FontPreloader,
    private readonly imageExporter: ImageExporter,
    private readonly blobDownloader: BlobDownloader,
  ) {}

  async execute(
    target: HTMLElement,
    options: DownloadImageOptions,
  ): Promise<DownloadSnippetOutcome> {
    await this.fontPreloader.preload(options.fontFamily);
    const exportOutcome = await this.imageExporter.export(target, {
      scale: options.scale,
      format: options.format,
    });
    if (exportOutcome.kind !== 'exported') {
      return { kind: 'export_failed', cause: exportOutcome.cause };
    }
    return await this.blobDownloader.download(exportOutcome.blob, options.filename);
  }
}
