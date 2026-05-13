import { useRef } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useSnippetExportHandles } from '@/adapters/primary/app/useSnippetExportHandles';
import type { DownloadOutcome } from '@/application/ports/BlobDownloader';
import type { CopyImageOutcome } from '@/application/ports/ClipboardCopier';
import type { ExportImageOutcome } from '@/application/ports/ImageExporter';
import { CopySnippetAsImage } from '@/application/use-cases/CopySnippetAsImage';
import { DownloadSnippetAsImage } from '@/application/use-cases/DownloadSnippetAsImage';
import { ReportSidePanelFailure } from '@/application/use-cases/ReportSidePanelFailure';
import type { ExportFormat, FontFamily } from '@/domain/rendering/RenderConfig';

import { FakeClock } from '../../setup/fakes/FakeClock';
import { FixedIdGenerator } from '../../setup/fakes/FixedIdGenerator';
import { anExportedPng } from '../../setup/fakes/imageOutcomes';
import { SpyBlobDownloader } from '../../setup/fakes/SpyBlobDownloader';
import { SpyClipboardCopier } from '../../setup/fakes/SpyClipboardCopier';
import { SpyErrorReporter } from '../../setup/fakes/SpyErrorReporter';
import { SpyFontPreloader } from '../../setup/fakes/SpyFontPreloader';
import { SpyImageExporter } from '../../setup/fakes/SpyImageExporter';

const A_FONT: FontFamily = 'JetBrains Mono';
const A_FORMAT: ExportFormat = 'png';
const A_CLOCK = new FakeClock(new Date('2026-05-12T10:00:00.000Z'));

interface BuiltSut {
  readonly copyUseCase: CopySnippetAsImage;
  readonly downloadUseCase: DownloadSnippetAsImage;
  readonly reporter: SpyErrorReporter;
  readonly reportFailureUseCase: ReportSidePanelFailure;
}

function aSut(opts: {
  exporterOutcome?: ExportImageOutcome;
  clipboardOutcome?: CopyImageOutcome;
  downloadOutcome?: DownloadOutcome;
}): BuiltSut {
  const exporterOutcome = opts.exporterOutcome ?? anExportedPng();
  const clipboardOutcome = opts.clipboardOutcome ?? { kind: 'copied' };
  const downloadOutcome = opts.downloadOutcome ?? { kind: 'downloaded' };

  const reporter = new SpyErrorReporter();
  return {
    copyUseCase: new CopySnippetAsImage(
      new SpyFontPreloader(),
      new SpyImageExporter(exporterOutcome),
      new SpyClipboardCopier(clipboardOutcome),
    ),
    downloadUseCase: new DownloadSnippetAsImage(
      new SpyFontPreloader(),
      new SpyImageExporter(exporterOutcome),
      new SpyBlobDownloader(downloadOutcome),
    ),
    reporter,
    reportFailureUseCase: new ReportSidePanelFailure(reporter, A_CLOCK, new FixedIdGenerator()),
  };
}

interface HarnessProps {
  readonly sut: BuiltSut;
}

function Harness({ sut }: HarnessProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { copyHandle, downloadHandle } = useSnippetExportHandles({
    copySnippetAsImage: sut.copyUseCase,
    downloadSnippetAsImage: sut.downloadUseCase,
    reportSidePanelFailure: sut.reportFailureUseCase,
    previewRef: ref,
    fontFamily: A_FONT,
    exportFormat: A_FORMAT,
    clock: A_CLOCK,
  });
  return (
    <>
      <div ref={ref}>preview</div>
      <button onClick={copyHandle.onCopy}>copy</button>
      <button onClick={downloadHandle.onDownload}>download</button>
      {copyHandle.status && <p data-testid="copy-status">{copyHandle.status.kind}</p>}
      {downloadHandle.status && <p data-testid="download-status">{downloadHandle.status.kind}</p>}
    </>
  );
}

describe('useSnippetExportHandles', () => {
  it('should_not_report_a_failure_when_copy_succeeds', async () => {
    const user = userEvent.setup();
    const sut = aSut({ clipboardOutcome: { kind: 'copied' } });
    render(<Harness sut={sut} />);

    await user.click(screen.getByRole('button', { name: 'copy' }));
    await screen.findByTestId('copy-status');

    expect(sut.reporter.reports).toEqual([]);
  });

  it('should_report_a_snippet_export_failure_with_the_copy_message_when_copy_is_denied', async () => {
    const user = userEvent.setup();
    const cause = new Error('clipboard denied');
    const sut = aSut({ clipboardOutcome: { kind: 'denied', cause } });
    render(<Harness sut={sut} />);

    await user.click(screen.getByRole('button', { name: 'copy' }));
    await screen.findByTestId('copy-status');

    await waitFor(() => {
      expect(sut.reporter.reports).toHaveLength(1);
    });
    const report = sut.reporter.reports[0]?.toSnapshot();
    expect(report?.kind).toBe('snippet_export_failed');
    expect(report?.message).toBe('Snipworth could not copy the snippet image.');
    expect(report?.details).toContain('clipboard denied');
  });

  it('should_report_a_snippet_export_failure_with_the_copy_message_when_export_fails_before_copy', async () => {
    const user = userEvent.setup();
    const sut = aSut({
      exporterOutcome: { kind: 'rasterization_failed', cause: new Error('canvas exploded') },
      clipboardOutcome: { kind: 'copied' },
    });
    render(<Harness sut={sut} />);

    await user.click(screen.getByRole('button', { name: 'copy' }));
    await screen.findByTestId('copy-status');

    await waitFor(() => {
      expect(sut.reporter.reports).toHaveLength(1);
    });
    const report = sut.reporter.reports[0]?.toSnapshot();
    expect(report?.kind).toBe('snippet_export_failed');
    expect(report?.message).toBe('Snipworth could not copy the snippet image.');
  });

  it('should_not_report_a_failure_when_download_succeeds', async () => {
    const user = userEvent.setup();
    const sut = aSut({ downloadOutcome: { kind: 'downloaded' } });
    render(<Harness sut={sut} />);

    await user.click(screen.getByRole('button', { name: 'download' }));
    await screen.findByTestId('download-status');

    expect(sut.reporter.reports).toEqual([]);
  });

  it('should_report_a_snippet_export_failure_with_the_download_message_when_download_fails', async () => {
    const user = userEvent.setup();
    const cause = new Error('disk full');
    const sut = aSut({ downloadOutcome: { kind: 'download_failed', cause } });
    render(<Harness sut={sut} />);

    await user.click(screen.getByRole('button', { name: 'download' }));
    await screen.findByTestId('download-status');

    await waitFor(() => {
      expect(sut.reporter.reports).toHaveLength(1);
    });
    const report = sut.reporter.reports[0]?.toSnapshot();
    expect(report?.kind).toBe('snippet_export_failed');
    expect(report?.message).toBe('Snipworth could not save the snippet image.');
    expect(report?.details).toContain('disk full');
  });
});
