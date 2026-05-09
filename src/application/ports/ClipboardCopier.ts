export type CopyImageOutcome =
  | { readonly kind: 'copied' }
  | { readonly kind: 'denied'; readonly cause: unknown }
  | { readonly kind: 'copy_failed'; readonly cause: unknown };

export interface ClipboardCopier {
  copyImage(getBlob: () => Promise<Blob>): Promise<CopyImageOutcome>;
}
