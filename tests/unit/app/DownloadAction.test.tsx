import { useRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { DownloadAction } from '@/adapters/primary/app/DownloadAction';
import type { BlobDownloader, DownloadOutcome } from '@/application/ports/BlobDownloader';
import type {
  ExportImageOutcome,
  ImageExporter,
  ImageExportOptions,
} from '@/application/ports/ImageExporter';
import { DownloadSnippetAsImage } from '@/application/use-cases/DownloadSnippetAsImage';
import type { ExportFormat } from '@/domain/rendering/RenderConfig';
import { FakeClock } from '../../setup/fakes/FakeClock';

interface ExporterCall {
  readonly format: ExportFormat;
}

class SpyImageExporter implements ImageExporter {
  readonly calls: ExporterCall[] = [];
  constructor(private readonly outcome: ExportImageOutcome) {}

  export(_target: HTMLElement, options: ImageExportOptions): Promise<ExportImageOutcome> {
    this.calls.push({ format: options.format });
    return Promise.resolve(this.outcome);
  }
}

interface DownloadCall {
  readonly filename: string;
}

class SpyBlobDownloader implements BlobDownloader {
  readonly calls: DownloadCall[] = [];
  constructor(private readonly outcome: DownloadOutcome) {}

  download(_blob: Blob, filename: string): Promise<DownloadOutcome> {
    this.calls.push({ filename });
    return Promise.resolve(this.outcome);
  }
}

const exportedPng: ExportImageOutcome = {
  kind: 'exported',
  blob: new Blob(['png-bytes'], { type: 'image/png' }),
};

interface UseCaseHarness {
  readonly useCase: DownloadSnippetAsImage;
  readonly exporter: SpyImageExporter;
  readonly downloader: SpyBlobDownloader;
}

function aUseCaseFor(
  exporterOutcome: ExportImageOutcome,
  downloadOutcome: DownloadOutcome,
): UseCaseHarness {
  const exporter = new SpyImageExporter(exporterOutcome);
  const downloader = new SpyBlobDownloader(downloadOutcome);
  return {
    useCase: new DownloadSnippetAsImage(exporter, downloader),
    exporter,
    downloader,
  };
}

const FIXED_CLOCK = new FakeClock(new Date('2026-05-09T14:23:05.000Z'));

function DownloadActionHarness({ useCase }: { useCase: DownloadSnippetAsImage }) {
  const targetRef = useRef<HTMLDivElement>(null);
  return (
    <>
      <div ref={targetRef}>snippet preview</div>
      <DownloadAction useCase={useCase} targetRef={targetRef} clock={FIXED_CLOCK} />
    </>
  );
}

describe('DownloadAction', () => {
  it('should_show_a_downloaded_status_when_the_png_button_is_clicked_and_use_case_returns_downloaded', async () => {
    const user = userEvent.setup();
    const harness = aUseCaseFor(exportedPng, { kind: 'downloaded' });
    render(<DownloadActionHarness useCase={harness.useCase} />);

    await user.click(screen.getByRole('button', { name: 'Download as PNG' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Downloaded');
  });

  it('should_show_a_downloaded_status_when_the_svg_button_is_clicked_and_use_case_returns_downloaded', async () => {
    const user = userEvent.setup();
    const harness = aUseCaseFor(exportedPng, { kind: 'downloaded' });
    render(<DownloadActionHarness useCase={harness.useCase} />);

    await user.click(screen.getByRole('button', { name: 'Download as SVG' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Downloaded');
  });

  it('should_request_a_png_export_and_a_png_filename_when_png_button_is_clicked', async () => {
    const user = userEvent.setup();
    const harness = aUseCaseFor(exportedPng, { kind: 'downloaded' });
    render(<DownloadActionHarness useCase={harness.useCase} />);

    await user.click(screen.getByRole('button', { name: 'Download as PNG' }));
    await screen.findByRole('status');

    expect(harness.exporter.calls).toEqual([{ format: 'png' }]);
    expect(harness.downloader.calls).toHaveLength(1);
    expect(harness.downloader.calls[0]?.filename).toMatch(/^snipworth-.+\.png$/);
  });

  it('should_request_an_svg_export_and_an_svg_filename_when_svg_button_is_clicked', async () => {
    const user = userEvent.setup();
    const harness = aUseCaseFor(exportedPng, { kind: 'downloaded' });
    render(<DownloadActionHarness useCase={harness.useCase} />);

    await user.click(screen.getByRole('button', { name: 'Download as SVG' }));
    await screen.findByRole('status');

    expect(harness.exporter.calls).toEqual([{ format: 'svg' }]);
    expect(harness.downloader.calls).toHaveLength(1);
    expect(harness.downloader.calls[0]?.filename).toMatch(/^snipworth-.+\.svg$/);
  });

  it('should_show_a_download_failed_status_when_the_downloader_returns_download_failed', async () => {
    const user = userEvent.setup();
    const harness = aUseCaseFor(exportedPng, {
      kind: 'download_failed',
      cause: new Error('save dialog cancelled'),
    });
    render(<DownloadActionHarness useCase={harness.useCase} />);

    await user.click(screen.getByRole('button', { name: 'Download as PNG' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Could not save the file');
  });

  it('should_show_an_export_failed_status_when_the_exporter_reports_a_rasterization_failure', async () => {
    const user = userEvent.setup();
    const harness = aUseCaseFor(
      { kind: 'rasterization_failed', cause: new Error('rast') },
      { kind: 'downloaded' },
    );
    render(<DownloadActionHarness useCase={harness.useCase} />);

    await user.click(screen.getByRole('button', { name: 'Download as PNG' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Could not export the snippet as an image',
    );
  });
});
