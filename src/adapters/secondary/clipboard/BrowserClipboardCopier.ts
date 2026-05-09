import type { ClipboardCopier, CopyImageOutcome } from '@/application/ports/ClipboardCopier';

export type ClipboardWriteFn = (items: ClipboardItem[]) => Promise<void>;
export type ClipboardItemCtor = new (items: Record<string, ClipboardItemData>) => ClipboardItem;

const PNG_MIME = 'image/png';

// W3C Async Clipboard API: a write rejected for missing permission or expired
// user activation surfaces as a DOMException whose `name` is "NotAllowedError".
// We map it to `denied` so the UI can suggest fixing permission, while every
// other rejection collapses to `copy_failed`.
const NOT_ALLOWED_ERROR_NAME = 'NotAllowedError';

export class BrowserClipboardCopier implements ClipboardCopier {
  private readonly write: ClipboardWriteFn;
  private readonly itemCtor: ClipboardItemCtor;

  constructor(
    write: ClipboardWriteFn = (items) => navigator.clipboard.write(items),
    itemCtor: ClipboardItemCtor = ClipboardItem,
  ) {
    this.write = write;
    this.itemCtor = itemCtor;
  }

  async copyImage(getBlob: () => Promise<Blob>): Promise<CopyImageOutcome> {
    const blobPromise = getBlob();
    const Item = this.itemCtor;
    const item = new Item({ [PNG_MIME]: blobPromise });
    try {
      await this.write([item]);
      return { kind: 'copied' };
    } catch (cause) {
      if (isNotAllowedError(cause)) {
        return { kind: 'denied', cause };
      }
      return { kind: 'copy_failed', cause };
    }
  }
}

function isNotAllowedError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === NOT_ALLOWED_ERROR_NAME
  );
}
