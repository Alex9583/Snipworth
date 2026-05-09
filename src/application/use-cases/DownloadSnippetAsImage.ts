import type { BlobDownloader, DownloadOutcome } from '@/application/ports/BlobDownloader';
import type { ImageExporter } from '@/application/ports/ImageExporter';
import type { ExportFormat, ExportScale } from '@/domain/rendering/RenderConfig';

const DEFAULT_DOWNLOAD_SCALE: ExportScale = 2;

export type DownloadSnippetOutcome =
  | DownloadOutcome
  | { readonly kind: 'export_failed'; readonly cause: unknown };

export class DownloadSnippetAsImage {
  constructor(
    private readonly imageExporter: ImageExporter,
    private readonly blobDownloader: BlobDownloader,
  ) {}

  async execute(
    target: HTMLElement,
    format: ExportFormat,
    filename: string,
  ): Promise<DownloadSnippetOutcome> {
    const exportOutcome = await this.imageExporter.export(target, {
      scale: DEFAULT_DOWNLOAD_SCALE,
      format,
    });
    if (exportOutcome.kind !== 'exported') {
      return { kind: 'export_failed', cause: exportOutcome.cause };
    }
    return await this.blobDownloader.download(exportOutcome.blob, filename);
  }
}
