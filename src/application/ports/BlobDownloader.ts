export type DownloadOutcome =
  | { readonly kind: 'downloaded' }
  | { readonly kind: 'download_failed'; readonly cause: unknown };

export interface BlobDownloader {
  download(blob: Blob, filename: string): Promise<DownloadOutcome>;
}
