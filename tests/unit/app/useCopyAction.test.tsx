import { useRef } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useCopyAction } from '@/adapters/primary/app/useCopyAction';
import type { CopyImageOutcome } from '@/application/ports/ClipboardCopier';
import type { ExportImageOutcome } from '@/application/ports/ImageExporter';
import {
  CopySnippetAsImage,
  type CopySnippetOutcome,
} from '@/application/use-cases/CopySnippetAsImage';
import type { ExportScale, FontFamily } from '@/domain/rendering/RenderConfig';

import { anExportedPng } from '../../setup/fakes/imageOutcomes';
import { SpyClipboardCopier } from '../../setup/fakes/SpyClipboardCopier';
import { SpyFontPreloader } from '../../setup/fakes/SpyFontPreloader';
import { SpyImageExporter } from '../../setup/fakes/SpyImageExporter';

const A_FONT: FontFamily = 'JetBrains Mono';
const A_SCALE: ExportScale = 2;

function aUseCase(
  exporterOutcome: ExportImageOutcome,
  clipboardOutcome: CopyImageOutcome,
): CopySnippetAsImage {
  return new CopySnippetAsImage(
    new SpyFontPreloader(),
    new SpyImageExporter(exporterOutcome),
    new SpyClipboardCopier(clipboardOutcome),
  );
}

interface HarnessProps {
  readonly useCase: CopySnippetAsImage;
  readonly scale?: ExportScale;
  readonly onOutcome?: (outcome: CopySnippetOutcome) => void;
}

function Harness({ useCase, scale = A_SCALE, onOutcome }: HarnessProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { onCopy, status } = useCopyAction(
    { useCase, targetRef: ref, fontFamily: A_FONT, scale },
    onOutcome,
  );
  return (
    <>
      <div ref={ref}>preview</div>
      <button onClick={onCopy}>copy</button>
      {status && <p data-testid="status">{status.kind}</p>}
    </>
  );
}

describe('useCopyAction', () => {
  it('should_expose_a_copied_status_when_use_case_returns_copied', async () => {
    const user = userEvent.setup();
    render(<Harness useCase={aUseCase(anExportedPng(), { kind: 'copied' })} />);

    await user.click(screen.getByRole('button', { name: 'copy' }));

    expect(await screen.findByTestId('status')).toHaveTextContent('copied');
  });

  it('should_expose_an_export_failed_status_when_exporter_reports_a_failure', async () => {
    const user = userEvent.setup();
    render(
      <Harness
        useCase={aUseCase(
          { kind: 'rasterization_failed', cause: new Error('boom') },
          { kind: 'copied' },
        )}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'copy' }));

    expect(await screen.findByTestId('status')).toHaveTextContent('export_failed');
  });

  it('should_expose_a_denied_status_when_clipboard_returns_denied', async () => {
    const user = userEvent.setup();
    render(
      <Harness
        useCase={aUseCase(anExportedPng(), { kind: 'denied', cause: new Error('not allowed') })}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'copy' }));

    expect(await screen.findByTestId('status')).toHaveTextContent('denied');
  });

  it('should_forward_the_provided_scale_to_the_image_exporter', async () => {
    const user = userEvent.setup();
    const exporter = new SpyImageExporter(anExportedPng());
    const useCase = new CopySnippetAsImage(
      new SpyFontPreloader(),
      exporter,
      new SpyClipboardCopier({ kind: 'copied' }),
    );
    render(<Harness useCase={useCase} scale={4} />);

    await user.click(screen.getByRole('button', { name: 'copy' }));
    await screen.findByTestId('status');

    expect(exporter.calls[0]?.options.scale).toBe(4);
  });

  it('should_invoke_the_outcome_callback_when_copy_resolves', async () => {
    const user = userEvent.setup();
    const observed: CopySnippetOutcome[] = [];
    render(
      <Harness
        useCase={aUseCase(anExportedPng(), { kind: 'copied' })}
        onOutcome={(outcome) => observed.push(outcome)}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'copy' }));
    await screen.findByTestId('status');

    expect(observed).toEqual([{ kind: 'copied' }]);
  });
});
