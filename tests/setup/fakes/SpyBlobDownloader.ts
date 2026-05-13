import type { BlobDownloader, DownloadOutcome } from '@/application/ports/BlobDownloader';

export interface DownloadCall {
  readonly blob: Blob;
  readonly filename: string;
}

export class SpyBlobDownloader implements BlobDownloader {
  readonly calls: DownloadCall[] = [];

  constructor(private readonly outcome: DownloadOutcome) {}

  download(blob: Blob, filename: string): Promise<DownloadOutcome> {
    this.calls.push({ blob, filename });
    return Promise.resolve(this.outcome);
  }
}
