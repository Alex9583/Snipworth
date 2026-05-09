import type { BlobDownloader, DownloadOutcome } from '@/application/ports/BlobDownloader';

export type CreateObjectURLFn = (blob: Blob) => string;
export type RevokeObjectURLFn = (url: string) => void;
export type TriggerDownloadFn = (url: string, filename: string) => void;

export class BrowserBlobDownloader implements BlobDownloader {
  private readonly createObjectURL: CreateObjectURLFn;
  private readonly revokeObjectURL: RevokeObjectURLFn;
  private readonly triggerDownload: TriggerDownloadFn;

  constructor(
    createObjectURL: CreateObjectURLFn = (blob) => URL.createObjectURL(blob),
    revokeObjectURL: RevokeObjectURLFn = (url) => {
      URL.revokeObjectURL(url);
    },
    triggerDownload: TriggerDownloadFn = anchorClickDownload,
  ) {
    this.createObjectURL = createObjectURL;
    this.revokeObjectURL = revokeObjectURL;
    this.triggerDownload = triggerDownload;
  }

  download(blob: Blob, filename: string): Promise<DownloadOutcome> {
    const url = this.createObjectURL(blob);
    try {
      this.triggerDownload(url, filename);
      return Promise.resolve({ kind: 'downloaded' });
    } catch (cause) {
      return Promise.resolve({ kind: 'download_failed', cause });
    } finally {
      this.revokeObjectURL(url);
    }
  }
}

function anchorClickDownload(url: string, filename: string): void {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
