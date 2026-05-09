import { useRef } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopyAction } from '@/adapters/primary/app/CopyAction';
import type { ClipboardCopier, CopyImageOutcome } from '@/application/ports/ClipboardCopier';
import type { ExportImageOutcome, ImageExporter } from '@/application/ports/ImageExporter';
import { CopySnippetAsImage } from '@/application/use-cases/CopySnippetAsImage';

class StubImageExporter implements ImageExporter {
  constructor(private readonly outcome: ExportImageOutcome) {}

  export(): Promise<ExportImageOutcome> {
    return Promise.resolve(this.outcome);
  }
}

class StubClipboardCopier implements ClipboardCopier {
  constructor(private readonly outcome: CopyImageOutcome) {}

  copyImage(): Promise<CopyImageOutcome> {
    return Promise.resolve(this.outcome);
  }
}

const exportedPng: ExportImageOutcome = {
  kind: 'exported',
  blob: new Blob(['png-bytes'], { type: 'image/png' }),
};

function aUseCaseFor(
  exporterOutcome: ExportImageOutcome,
  clipboardOutcome: CopyImageOutcome,
): CopySnippetAsImage {
  return new CopySnippetAsImage(
    new StubImageExporter(exporterOutcome),
    new StubClipboardCopier(clipboardOutcome),
  );
}

function CopyActionHarness({ useCase }: { useCase: CopySnippetAsImage }) {
  const targetRef = useRef<HTMLDivElement>(null);
  return (
    <>
      <div ref={targetRef}>snippet preview</div>
      <CopyAction useCase={useCase} targetRef={targetRef} />
    </>
  );
}

describe('CopyAction', () => {
  it('should_show_a_copied_status_when_the_use_case_returns_copied', async () => {
    const user = userEvent.setup();
    render(<CopyActionHarness useCase={aUseCaseFor(exportedPng, { kind: 'copied' })} />);

    await user.click(screen.getByRole('button', { name: 'Copy as PNG' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Copied to clipboard');
  });

  it('should_show_a_permission_denied_status_when_the_clipboard_returns_denied', async () => {
    const user = userEvent.setup();
    render(
      <CopyActionHarness
        useCase={aUseCaseFor(exportedPng, { kind: 'denied', cause: new Error('not allowed') })}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Copy as PNG' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Clipboard permission denied — please allow clipboard access',
    );
  });

  it('should_show_a_copy_failed_status_when_the_clipboard_returns_copy_failed', async () => {
    const user = userEvent.setup();
    render(
      <CopyActionHarness
        useCase={aUseCaseFor(exportedPng, { kind: 'copy_failed', cause: new Error('boom') })}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Copy as PNG' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Could not copy to clipboard');
  });

  it('should_show_an_export_failed_status_when_the_exporter_reports_a_rasterization_failure', async () => {
    const user = userEvent.setup();
    render(
      <CopyActionHarness
        useCase={aUseCaseFor(
          { kind: 'rasterization_failed', cause: new Error('rast') },
          { kind: 'copied' },
        )}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Copy as PNG' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Could not export the snippet as an image',
    );
  });
});
