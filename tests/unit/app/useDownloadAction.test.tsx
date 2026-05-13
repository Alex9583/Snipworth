import { useRef } from 'react';
import { describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useDownloadAction } from '@/adapters/primary/app/useDownloadAction';
import type { DownloadOutcome } from '@/application/ports/BlobDownloader';
import type {
  ExportImageOutcome,
  ImageExporter,
  ImageExportOptions,
} from '@/application/ports/ImageExporter';
import {
  DownloadSnippetAsImage,
  type DownloadSnippetOutcome,
} from '@/application/use-cases/DownloadSnippetAsImage';
import type { ExportFormat, FontFamily } from '@/domain/rendering/RenderConfig';

import { FakeClock } from '../../setup/fakes/FakeClock';
import { anExportedPng } from '../../setup/fakes/imageOutcomes';
import { SpyBlobDownloader } from '../../setup/fakes/SpyBlobDownloader';
import { SpyFontPreloader } from '../../setup/fakes/SpyFontPreloader';
import { SpyImageExporter } from '../../setup/fakes/SpyImageExporter';

const A_FONT: FontFamily = 'JetBrains Mono';
const FIXED_CLOCK = new FakeClock(new Date('2026-05-09T14:23:05.000Z'));

interface Harnessed {
  readonly useCase: DownloadSnippetAsImage;
  readonly exporter: SpyImageExporter;
  readonly downloader: SpyBlobDownloader;
}

function aUseCase(
  exporterOutcome: ExportImageOutcome,
  downloadOutcome: DownloadOutcome,
): Harnessed {
  const exporter = new SpyImageExporter(exporterOutcome);
  const downloader = new SpyBlobDownloader(downloadOutcome);
  return {
    useCase: new DownloadSnippetAsImage(new SpyFontPreloader(), exporter, downloader),
    exporter,
    downloader,
  };
}

class DeferredImageExporter implements ImageExporter {
  private resolveFn!: (outcome: ExportImageOutcome) => void;
  private readonly pending = new Promise<ExportImageOutcome>((resolve) => {
    this.resolveFn = resolve;
  });

  export(_target: HTMLElement, _options: ImageExportOptions): Promise<ExportImageOutcome> {
    return this.pending;
  }

  resolveWith(outcome: ExportImageOutcome): void {
    this.resolveFn(outcome);
  }
}

interface HarnessProps {
  readonly useCase: DownloadSnippetAsImage;
  readonly format: ExportFormat;
  readonly onOutcome?: (outcome: DownloadSnippetOutcome) => void;
}

function Harness({ useCase, format, onOutcome }: HarnessProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { onDownload, status } = useDownloadAction(
    useCase,
    ref,
    A_FONT,
    format,
    FIXED_CLOCK,
    onOutcome,
  );
  return (
    <>
      <div ref={ref}>preview</div>
      <button onClick={onDownload}>download</button>
      {status && <p data-testid="status">{status.kind}</p>}
    </>
  );
}

describe('useDownloadAction', () => {
  it('should_expose_a_downloaded_status_when_use_case_returns_downloaded', async () => {
    const user = userEvent.setup();
    const { useCase } = aUseCase(anExportedPng(), { kind: 'downloaded' });
    render(<Harness useCase={useCase} format="png" />);

    await user.click(screen.getByRole('button', { name: 'download' }));

    expect(await screen.findByTestId('status')).toHaveTextContent('downloaded');
  });

  it('should_request_the_export_in_the_provided_format', async () => {
    const user = userEvent.setup();
    const harness = aUseCase(anExportedPng(), { kind: 'downloaded' });
    render(<Harness useCase={harness.useCase} format="svg" />);

    await user.click(screen.getByRole('button', { name: 'download' }));
    await screen.findByTestId('status');

    expect(harness.exporter.calls).toHaveLength(1);
    expect(harness.exporter.calls[0]?.options).toEqual({ scale: 2, format: 'svg' });
  });

  it('should_use_the_clock_to_build_a_dated_filename', async () => {
    const user = userEvent.setup();
    const harness = aUseCase(anExportedPng(), { kind: 'downloaded' });
    render(<Harness useCase={harness.useCase} format="png" />);

    await user.click(screen.getByRole('button', { name: 'download' }));
    await screen.findByTestId('status');

    expect(harness.downloader.calls).toHaveLength(1);
    expect(harness.downloader.calls[0]?.filename).toMatch(/^snipworth-.+\.png$/);
  });

  it('should_expose_an_export_failed_status_when_exporter_reports_a_failure', async () => {
    const user = userEvent.setup();
    const { useCase } = aUseCase(
      { kind: 'rasterization_failed', cause: new Error('boom') },
      { kind: 'downloaded' },
    );
    render(<Harness useCase={useCase} format="png" />);

    await user.click(screen.getByRole('button', { name: 'download' }));

    expect(await screen.findByTestId('status')).toHaveTextContent('export_failed');
  });

  it('should_invoke_the_outcome_callback_when_download_resolves', async () => {
    const user = userEvent.setup();
    const observed: DownloadSnippetOutcome[] = [];
    const { useCase } = aUseCase(anExportedPng(), { kind: 'downloaded' });
    render(
      <Harness useCase={useCase} format="png" onOutcome={(outcome) => observed.push(outcome)} />,
    );

    await user.click(screen.getByRole('button', { name: 'download' }));
    await screen.findByTestId('status');

    expect(observed).toEqual([{ kind: 'downloaded' }]);
  });

  it('should_invoke_the_outcome_callback_even_when_component_unmounts_before_resolution', async () => {
    const user = userEvent.setup();
    const exporter = new DeferredImageExporter();
    const useCase = new DownloadSnippetAsImage(
      new SpyFontPreloader(),
      exporter,
      new SpyBlobDownloader({ kind: 'downloaded' }),
    );
    const observed: DownloadSnippetOutcome[] = [];

    const { unmount } = render(
      <Harness useCase={useCase} format="png" onOutcome={(outcome) => observed.push(outcome)} />,
    );
    await user.click(screen.getByRole('button', { name: 'download' }));

    unmount();

    await act(async () => {
      exporter.resolveWith({ kind: 'rasterization_failed', cause: new Error('late failure') });
      await Promise.resolve();
    });

    expect(observed).toHaveLength(1);
    expect(observed[0]?.kind).toBe('export_failed');
  });
});
