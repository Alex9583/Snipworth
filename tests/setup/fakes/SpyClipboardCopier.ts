import type { ClipboardCopier, CopyImageOutcome } from '@/application/ports/ClipboardCopier';

type BlobFactory = () => Promise<Blob>;

export class SpyClipboardCopier implements ClipboardCopier {
  readonly factories: BlobFactory[] = [];

  constructor(private readonly outcome: CopyImageOutcome) {}

  copyImage(getBlob: BlobFactory): Promise<CopyImageOutcome> {
    this.factories.push(getBlob);
    return Promise.resolve(this.outcome);
  }
}
