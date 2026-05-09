import { describe, it, expect } from 'vitest';
import { CopySnippetAsImage } from '@/application/use-cases/CopySnippetAsImage';
import type { ClipboardCopier, CopyImageOutcome } from '@/application/ports/ClipboardCopier';
import type {
  ExportImageOutcome,
  ImageExporter,
  ImageExportOptions,
} from '@/application/ports/ImageExporter';

interface ExporterCall {
  readonly target: HTMLElement;
  readonly options: ImageExportOptions;
}

class SpyImageExporter implements ImageExporter {
  readonly calls: ExporterCall[] = [];
  constructor(private readonly outcome: ExportImageOutcome) {}

  export(target: HTMLElement, options: ImageExportOptions): Promise<ExportImageOutcome> {
    this.calls.push({ target, options });
    return Promise.resolve(this.outcome);
  }
}

type BlobFactory = () => Promise<Blob>;

class SpyClipboardCopier implements ClipboardCopier {
  readonly factories: BlobFactory[] = [];
  constructor(private readonly outcome: CopyImageOutcome) {}

  copyImage(getBlob: BlobFactory): Promise<CopyImageOutcome> {
    this.factories.push(getBlob);
    return Promise.resolve(this.outcome);
  }
}

const aPngBlob = (): Blob => new Blob(['png-bytes'], { type: 'image/png' });

const exportedOutcome = (blob: Blob = aPngBlob()): ExportImageOutcome => ({
  kind: 'exported',
  blob,
});

describe('CopySnippetAsImage', () => {
  it('should_return_copied_when_export_and_copy_both_succeed', async () => {
    const exporter = new SpyImageExporter(exportedOutcome());
    const clipboard = new SpyClipboardCopier({ kind: 'copied' });
    const useCase = new CopySnippetAsImage(exporter, clipboard);

    const outcome = await useCase.execute(document.createElement('div'));

    expect(outcome).toEqual({ kind: 'copied' });
  });

  it('should_return_denied_carrying_the_cause_when_clipboard_returns_denied', async () => {
    const cause = new Error('clipboard permission denied');
    const exporter = new SpyImageExporter(exportedOutcome());
    const clipboard = new SpyClipboardCopier({ kind: 'denied', cause });
    const useCase = new CopySnippetAsImage(exporter, clipboard);

    const outcome = await useCase.execute(document.createElement('div'));

    expect(outcome).toEqual({ kind: 'denied', cause });
  });

  it('should_return_copy_failed_carrying_the_cause_when_export_succeeds_but_clipboard_returns_copy_failed', async () => {
    const cause = new Error('clipboard service unavailable');
    const exporter = new SpyImageExporter(exportedOutcome());
    const clipboard = new SpyClipboardCopier({ kind: 'copy_failed', cause });
    const useCase = new CopySnippetAsImage(exporter, clipboard);

    const outcome = await useCase.execute(document.createElement('div'));

    expect(outcome).toEqual({ kind: 'copy_failed', cause });
  });

  it('should_return_export_failed_carrying_the_cause_when_image_exporter_reports_a_rasterization_failure', async () => {
    const cause = new Error('rasterization went wrong');
    const exporter = new SpyImageExporter({ kind: 'rasterization_failed', cause });
    const clipboard = new SpyClipboardCopier({ kind: 'copied' });
    const useCase = new CopySnippetAsImage(exporter, clipboard);

    const outcome = await useCase.execute(document.createElement('div'));

    expect(outcome).toEqual({ kind: 'export_failed', cause });
  });

  it('should_invoke_image_exporter_and_clipboard_copier_synchronously_within_the_same_turn_as_execute', () => {
    const exporter = new SpyImageExporter(exportedOutcome());
    const clipboard = new SpyClipboardCopier({ kind: 'copied' });
    const useCase = new CopySnippetAsImage(exporter, clipboard);

    void useCase.execute(document.createElement('div'));

    expect(exporter.calls).toHaveLength(1);
    expect(clipboard.factories).toHaveLength(1);
  });

  it('should_pass_the_target_and_the_2x_png_export_options_to_image_exporter', async () => {
    const target = document.createElement('div');
    const exporter = new SpyImageExporter(exportedOutcome());
    const clipboard = new SpyClipboardCopier({ kind: 'copied' });
    const useCase = new CopySnippetAsImage(exporter, clipboard);

    await useCase.execute(target);

    expect(exporter.calls).toEqual([{ target, options: { scale: 2, format: 'png' } }]);
  });
});
