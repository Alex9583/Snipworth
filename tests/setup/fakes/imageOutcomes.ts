import type { ExportImageOutcome } from '@/application/ports/ImageExporter';

export const aPngBlob = (): Blob => new Blob(['png-bytes'], { type: 'image/png' });

export const anExportedPng = (blob: Blob = aPngBlob()): ExportImageOutcome => ({
  kind: 'exported',
  blob,
});
