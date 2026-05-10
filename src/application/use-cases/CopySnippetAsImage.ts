import type { ClipboardCopier, CopyImageOutcome } from '@/application/ports/ClipboardCopier';
import type { FontPreloader } from '@/application/ports/FontPreloader';
import type {
  ExportImageOutcome,
  ImageExporter,
  ImageExportOptions,
} from '@/application/ports/ImageExporter';
import type { FontFamily } from '@/domain/rendering/RenderConfig';

const COPY_OPTIONS: ImageExportOptions = { scale: 2, format: 'png' };

export type CopySnippetOutcome =
  | CopyImageOutcome
  | { readonly kind: 'export_failed'; readonly cause: unknown };

export class CopySnippetAsImage {
  constructor(
    private readonly fontPreloader: FontPreloader,
    private readonly imageExporter: ImageExporter,
    private readonly clipboardCopier: ClipboardCopier,
  ) {}

  async execute(target: HTMLElement, fontFamily: FontFamily): Promise<CopySnippetOutcome> {
    const exportPromise = this.preloadThenExport(target, fontFamily);
    const copyPromise = this.clipboardCopier.copyImage(async () => {
      const exported = await exportPromise;
      if (exported.kind === 'exported') return exported.blob;
      throw new Error(`image export failed: ${exported.kind}`, { cause: exported.cause });
    });

    const [exportOutcome, copyOutcome] = await Promise.all([exportPromise, copyPromise]);
    if (exportOutcome.kind !== 'exported') {
      return { kind: 'export_failed', cause: exportOutcome.cause };
    }
    return copyOutcome;
  }

  private async preloadThenExport(
    target: HTMLElement,
    fontFamily: FontFamily,
  ): Promise<ExportImageOutcome> {
    await this.fontPreloader.preload(fontFamily);
    return this.imageExporter.export(target, COPY_OPTIONS);
  }
}
