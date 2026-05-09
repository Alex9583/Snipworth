import type { ClipboardCopier, CopyImageOutcome } from '@/application/ports/ClipboardCopier';
import type { ImageExporter, ImageExportOptions } from '@/application/ports/ImageExporter';

const COPY_OPTIONS: ImageExportOptions = { scale: 2, format: 'png' };

export type CopySnippetOutcome =
  | CopyImageOutcome
  | { readonly kind: 'export_failed'; readonly cause: unknown };

export class CopySnippetAsImage {
  constructor(
    private readonly imageExporter: ImageExporter,
    private readonly clipboardCopier: ClipboardCopier,
  ) {}

  async execute(target: HTMLElement): Promise<CopySnippetOutcome> {
    const exportPromise = this.imageExporter.export(target, COPY_OPTIONS);
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
}
