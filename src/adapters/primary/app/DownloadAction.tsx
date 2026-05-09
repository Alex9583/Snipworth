import { useState } from 'react';
import type { RefObject } from 'react';
import type { Clock } from '@/application/ports/Clock';
import type {
  DownloadSnippetAsImage,
  DownloadSnippetOutcome,
} from '@/application/use-cases/DownloadSnippetAsImage';
import { buildExportFilename } from '@/domain/export/buildExportFilename';
import type { ExportFormat } from '@/domain/rendering/RenderConfig';
import { downloadButtonLabel, downloadStatusLabel } from './strings';
import { Button } from './ui/Button';

interface DownloadActionProps<T extends HTMLElement> {
  readonly useCase: DownloadSnippetAsImage;
  readonly targetRef: RefObject<T | null>;
  readonly clock: Clock;
}

export function DownloadAction<T extends HTMLElement>({
  useCase,
  targetRef,
  clock,
}: DownloadActionProps<T>) {
  const [status, setStatus] = useState<DownloadSnippetOutcome | null>(null);

  const onDownload = (format: ExportFormat): void => {
    const target = targetRef.current;
    if (target === null) return;
    const filename = buildExportFilename(clock.now(), format);
    void useCase.execute(target, format, filename).then(setStatus);
  };

  return (
    <>
      <Button
        onClick={() => {
          onDownload('png');
        }}
      >
        {downloadButtonLabel('png')}
      </Button>
      <Button
        onClick={() => {
          onDownload('svg');
        }}
      >
        {downloadButtonLabel('svg')}
      </Button>
      {status && <p role="status">{downloadStatusLabel(status)}</p>}
    </>
  );
}
