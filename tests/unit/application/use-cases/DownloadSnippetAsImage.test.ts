import { describe, expect, it } from 'vitest';

import { DownloadSnippetAsImage } from '@/application/use-cases/DownloadSnippetAsImage';
import type { FontFamily } from '@/domain/rendering/RenderConfig';

import { aPngBlob, anExportedPng } from '../../../setup/fakes/imageOutcomes';
import { SpyBlobDownloader } from '../../../setup/fakes/SpyBlobDownloader';
import { SpyFontPreloader } from '../../../setup/fakes/SpyFontPreloader';
import { SpyImageExporter } from '../../../setup/fakes/SpyImageExporter';

const DEFAULT_FONT: FontFamily = 'JetBrains Mono';

describe('DownloadSnippetAsImage', () => {
  it('should_return_downloaded_when_export_and_download_both_succeed', async () => {
    const fontPreloader = new SpyFontPreloader();
    const exporter = new SpyImageExporter(anExportedPng());
    const downloader = new SpyBlobDownloader({ kind: 'downloaded' });
    const useCase = new DownloadSnippetAsImage(fontPreloader, exporter, downloader);

    const outcome = await useCase.execute(
      document.createElement('div'),
      DEFAULT_FONT,
      'png',
      'snipworth-2026-05-09-14-23-05.png',
    );

    expect(outcome).toEqual({ kind: 'downloaded' });
  });

  it('should_export_the_target_at_the_default_two_x_scale_in_the_requested_format', async () => {
    const target = document.createElement('div');
    const fontPreloader = new SpyFontPreloader();
    const exporter = new SpyImageExporter(anExportedPng());
    const downloader = new SpyBlobDownloader({ kind: 'downloaded' });
    const useCase = new DownloadSnippetAsImage(fontPreloader, exporter, downloader);

    await useCase.execute(target, DEFAULT_FONT, 'svg', 'snipworth.svg');

    expect(exporter.calls).toEqual([{ target, options: { scale: 2, format: 'svg' } }]);
  });

  it('should_save_the_exported_blob_under_the_requested_filename', async () => {
    const blob = aPngBlob();
    const fontPreloader = new SpyFontPreloader();
    const exporter = new SpyImageExporter(anExportedPng(blob));
    const downloader = new SpyBlobDownloader({ kind: 'downloaded' });
    const useCase = new DownloadSnippetAsImage(fontPreloader, exporter, downloader);

    await useCase.execute(document.createElement('div'), DEFAULT_FONT, 'png', 'snipworth.png');

    expect(downloader.calls).toEqual([{ blob, filename: 'snipworth.png' }]);
  });

  it('should_return_download_failed_carrying_the_cause_when_export_succeeds_but_downloader_returns_download_failed', async () => {
    const cause = new Error('save dialog cancelled');
    const fontPreloader = new SpyFontPreloader();
    const exporter = new SpyImageExporter(anExportedPng());
    const downloader = new SpyBlobDownloader({ kind: 'download_failed', cause });
    const useCase = new DownloadSnippetAsImage(fontPreloader, exporter, downloader);

    const outcome = await useCase.execute(
      document.createElement('div'),
      DEFAULT_FONT,
      'png',
      'snipworth.png',
    );

    expect(outcome).toEqual({ kind: 'download_failed', cause });
  });

  it('should_return_export_failed_carrying_the_cause_when_image_exporter_reports_a_rasterization_failure', async () => {
    const cause = new Error('rasterization went wrong');
    const fontPreloader = new SpyFontPreloader();
    const exporter = new SpyImageExporter({ kind: 'rasterization_failed', cause });
    const downloader = new SpyBlobDownloader({ kind: 'downloaded' });
    const useCase = new DownloadSnippetAsImage(fontPreloader, exporter, downloader);

    const outcome = await useCase.execute(
      document.createElement('div'),
      DEFAULT_FONT,
      'png',
      'snipworth.png',
    );

    expect(outcome).toEqual({ kind: 'export_failed', cause });
  });

  it('should_skip_the_downloader_when_image_exporter_reports_a_failure', async () => {
    const fontPreloader = new SpyFontPreloader();
    const exporter = new SpyImageExporter({
      kind: 'rasterization_failed',
      cause: new Error('boom'),
    });
    const downloader = new SpyBlobDownloader({ kind: 'downloaded' });
    const useCase = new DownloadSnippetAsImage(fontPreloader, exporter, downloader);

    await useCase.execute(document.createElement('div'), DEFAULT_FONT, 'png', 'snipworth.png');

    expect(downloader.calls).toHaveLength(0);
  });

  it('should_preload_the_provided_font_family_before_invoking_image_exporter', async () => {
    const events: string[] = [];
    const fontPreloader = new SpyFontPreloader({ kind: 'preloaded' }, events);
    const exporter = new SpyImageExporter(anExportedPng(), events);
    const downloader = new SpyBlobDownloader({ kind: 'downloaded' });
    const useCase = new DownloadSnippetAsImage(fontPreloader, exporter, downloader);

    await useCase.execute(document.createElement('div'), 'Fira Code', 'png', 'snipworth.png');

    expect(events).toEqual(['preload:Fira Code', 'export']);
  });
});
