import { toBlob as htiToBlob, toSvg as htiToSvg } from 'html-to-image';

import type {
  ExportImageOutcome,
  ImageExporter,
  ImageExportOptions,
} from '@/application/ports/ImageExporter';

export type ToBlobFn = typeof htiToBlob;
export type ToSvgFn = typeof htiToSvg;

export class HtmlToImageExporter implements ImageExporter {
  private readonly toBlob: ToBlobFn;
  private readonly toSvg: ToSvgFn;

  constructor(toBlob: ToBlobFn = htiToBlob, toSvg: ToSvgFn = htiToSvg) {
    this.toBlob = toBlob;
    this.toSvg = toSvg;
  }

  async export(target: HTMLElement, options: ImageExportOptions): Promise<ExportImageOutcome> {
    const rasterizerOptions = { pixelRatio: options.scale };

    try {
      if (options.format === 'svg') {
        const dataUrl = await this.toSvg(target, rasterizerOptions);
        return { kind: 'exported', blob: dataUrlToBlob(dataUrl) };
      }
      const blob = await this.toBlob(target, rasterizerOptions);
      if (blob === null) {
        return {
          kind: 'rasterization_failed',
          cause: new Error('html-to-image returned null'),
        };
      }
      return { kind: 'exported', blob };
    } catch (cause) {
      if (cause instanceof MalformedDataUrl) {
        return { kind: 'malformed_data_url', cause };
      }
      return { kind: 'rasterization_failed', cause };
    }
  }
}

const DATA_URL_PREFIX = 'data:';
const BASE64_SUFFIX = ';base64';

class MalformedDataUrl extends Error {
  constructor(reason: string) {
    super(`MalformedDataUrl: ${reason}`);
    this.name = 'MalformedDataUrl';
  }
}

function dataUrlToBlob(dataUrl: string): Blob {
  const commaIdx = dataUrl.indexOf(',');
  if (!dataUrl.startsWith(DATA_URL_PREFIX) || commaIdx < 0) {
    throw new MalformedDataUrl('expected a "data:<mime>[;base64],<body>" prefix');
  }
  const header = dataUrl.slice(DATA_URL_PREFIX.length, commaIdx);
  const body = dataUrl.slice(commaIdx + 1);
  const isBase64 = header.endsWith(BASE64_SUFFIX);
  const mimeSegment = isBase64 ? header.slice(0, -BASE64_SUFFIX.length) : header;
  const mime = mimeSegment.split(';')[0] ?? '';
  if (mime.length === 0) {
    throw new MalformedDataUrl('missing MIME type in header');
  }
  const bytes = isBase64
    ? Uint8Array.from(atob(body), (c) => c.charCodeAt(0))
    : new TextEncoder().encode(decodeURIComponent(body));
  return new Blob([bytes], { type: mime });
}
