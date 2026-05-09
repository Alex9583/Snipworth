import { describe, expect, it } from 'vitest';

import type { BlobDownloader, DownloadOutcome } from '@/application/ports/BlobDownloader';
import type {
  ExportImageOutcome,
  ImageExporter,
  ImageExportOptions,
} from '@/application/ports/ImageExporter';
import { DownloadSnippetAsImage } from '@/application/use-cases/DownloadSnippetAsImage';

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

interface DownloadCall {
  readonly blob: Blob;
  readonly filename: string;
}

class SpyBlobDownloader implements BlobDownloader {
  readonly calls: DownloadCall[] = [];
  constructor(private readonly outcome: DownloadOutcome) {}

  download(blob: Blob, filename: string): Promise<DownloadOutcome> {
    this.calls.push({ blob, filename });
    return Promise.resolve(this.outcome);
  }
}

const aPngBlob = (): Blob => new Blob(['png-bytes'], { type: 'image/png' });

const exportedOutcome = (blob: Blob = aPngBlob()): ExportImageOutcome => ({
  kind: 'exported',
  blob,
});

describe('DownloadSnippetAsImage', () => {
  it('should_return_downloaded_when_export_and_download_both_succeed', async () => {
    const exporter = new SpyImageExporter(exportedOutcome());
    const downloader = new SpyBlobDownloader({ kind: 'downloaded' });
    const useCase = new DownloadSnippetAsImage(exporter, downloader);

    const outcome = await useCase.execute(
      document.createElement('div'),
      'png',
      'snipworth-2026-05-09-14-23-05.png',
    );

    expect(outcome).toEqual({ kind: 'downloaded' });
  });

  it('should_export_the_target_at_the_default_two_x_scale_in_the_requested_format', async () => {
    const target = document.createElement('div');
    const exporter = new SpyImageExporter(exportedOutcome());
    const downloader = new SpyBlobDownloader({ kind: 'downloaded' });
    const useCase = new DownloadSnippetAsImage(exporter, downloader);

    await useCase.execute(target, 'svg', 'snipworth.svg');

    expect(exporter.calls).toEqual([{ target, options: { scale: 2, format: 'svg' } }]);
  });

  it('should_save_the_exported_blob_under_the_requested_filename', async () => {
    const blob = aPngBlob();
    const exporter = new SpyImageExporter(exportedOutcome(blob));
    const downloader = new SpyBlobDownloader({ kind: 'downloaded' });
    const useCase = new DownloadSnippetAsImage(exporter, downloader);

    await useCase.execute(document.createElement('div'), 'png', 'snipworth.png');

    expect(downloader.calls).toEqual([{ blob, filename: 'snipworth.png' }]);
  });

  it('should_return_download_failed_carrying_the_cause_when_export_succeeds_but_downloader_returns_download_failed', async () => {
    const cause = new Error('save dialog cancelled');
    const exporter = new SpyImageExporter(exportedOutcome());
    const downloader = new SpyBlobDownloader({ kind: 'download_failed', cause });
    const useCase = new DownloadSnippetAsImage(exporter, downloader);

    const outcome = await useCase.execute(document.createElement('div'), 'png', 'snipworth.png');

    expect(outcome).toEqual({ kind: 'download_failed', cause });
  });

  it('should_return_export_failed_carrying_the_cause_when_image_exporter_reports_a_rasterization_failure', async () => {
    const cause = new Error('rasterization went wrong');
    const exporter = new SpyImageExporter({ kind: 'rasterization_failed', cause });
    const downloader = new SpyBlobDownloader({ kind: 'downloaded' });
    const useCase = new DownloadSnippetAsImage(exporter, downloader);

    const outcome = await useCase.execute(document.createElement('div'), 'png', 'snipworth.png');

    expect(outcome).toEqual({ kind: 'export_failed', cause });
  });

  it('should_skip_the_downloader_when_image_exporter_reports_a_failure', async () => {
    const exporter = new SpyImageExporter({
      kind: 'rasterization_failed',
      cause: new Error('boom'),
    });
    const downloader = new SpyBlobDownloader({ kind: 'downloaded' });
    const useCase = new DownloadSnippetAsImage(exporter, downloader);

    await useCase.execute(document.createElement('div'), 'png', 'snipworth.png');

    expect(downloader.calls).toHaveLength(0);
  });
});
