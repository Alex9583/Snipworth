import { describe, it, expect } from 'vitest';

import {
  HtmlToImageExporter,
  type ToBlobFn,
  type ToSvgFn,
} from '@/adapters/secondary/image-export/HtmlToImageExporter';
import type { ImageExportOptions } from '@/application/ports/ImageExporter';

interface RasterizerCall {
  readonly target: HTMLElement;
  readonly options: unknown;
}

interface ToBlobSpy {
  readonly fn: ToBlobFn;
  readonly calls: RasterizerCall[];
}

interface ToSvgSpy {
  readonly fn: ToSvgFn;
  readonly calls: RasterizerCall[];
}

function spyToBlob(returnValue: Blob | null): ToBlobSpy {
  const calls: RasterizerCall[] = [];
  const fn: ToBlobFn = async (target, options) => {
    calls.push({ target, options });
    await Promise.resolve();
    return returnValue;
  };
  return { fn, calls };
}

function spyToSvg(returnValue: string): ToSvgSpy {
  const calls: RasterizerCall[] = [];
  const fn: ToSvgFn = async (target, options) => {
    calls.push({ target, options });
    await Promise.resolve();
    return returnValue;
  };
  return { fn, calls };
}

function throwingToBlob(cause: unknown): ToBlobFn {
  return async () => {
    await Promise.resolve();
    throw cause;
  };
}

function makeTarget(): HTMLDivElement {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return el;
}

const PNG: ImageExportOptions = { scale: 2, format: 'png' };
const SVG: ImageExportOptions = { scale: 2, format: 'svg' };

describe('HtmlToImageExporter', () => {
  it('should_return_an_exported_outcome_with_the_rasterizer_blob_when_format_is_png', async () => {
    const expectedBlob = new Blob(['png-bytes'], { type: 'image/png' });
    const blobSpy = spyToBlob(expectedBlob);
    const svgSpy = spyToSvg('');
    const exporter = new HtmlToImageExporter(blobSpy.fn, svgSpy.fn);

    const outcome = await exporter.export(makeTarget(), PNG);

    expect(outcome).toEqual({ kind: 'exported', blob: expectedBlob });
  });

  it('should_forward_scale_as_pixel_ratio_to_the_rasterizer_when_format_is_png', async () => {
    const blobSpy = spyToBlob(new Blob(['x']));
    const svgSpy = spyToSvg('');
    const exporter = new HtmlToImageExporter(blobSpy.fn, svgSpy.fn);
    const target = makeTarget();

    await exporter.export(target, { scale: 4, format: 'png' });

    expect(blobSpy.calls).toEqual([{ target, options: { pixelRatio: 4 } }]);
  });

  it('should_return_an_exported_outcome_with_an_svg_blob_when_format_is_svg', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>';
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    const blobSpy = spyToBlob(null);
    const svgSpy = spyToSvg(dataUrl);
    const exporter = new HtmlToImageExporter(blobSpy.fn, svgSpy.fn);

    const outcome = await exporter.export(makeTarget(), SVG);

    expect(outcome.kind).toBe('exported');
    if (outcome.kind !== 'exported') return;
    expect(outcome.blob.type).toBe('image/svg+xml');
    expect(await outcome.blob.text()).toBe(svg);
  });

  it('should_return_a_malformed_data_url_outcome_when_to_svg_returns_a_malformed_data_url', async () => {
    const blobSpy = spyToBlob(null);
    const svgSpy = spyToSvg('not-a-data-url');
    const exporter = new HtmlToImageExporter(blobSpy.fn, svgSpy.fn);

    const outcome = await exporter.export(makeTarget(), SVG);

    expect(outcome.kind).toBe('malformed_data_url');
  });

  it('should_return_a_rasterization_failed_outcome_when_the_rasterizer_returns_null', async () => {
    const blobSpy = spyToBlob(null);
    const svgSpy = spyToSvg('');
    const exporter = new HtmlToImageExporter(blobSpy.fn, svgSpy.fn);

    const outcome = await exporter.export(makeTarget(), PNG);

    expect(outcome.kind).toBe('rasterization_failed');
  });

  it('should_return_a_rasterization_failed_outcome_carrying_the_cause_when_the_rasterizer_throws', async () => {
    const cause = new Error('canvas tainted');
    const svgSpy = spyToSvg('');
    const exporter = new HtmlToImageExporter(throwingToBlob(cause), svgSpy.fn);

    const outcome = await exporter.export(makeTarget(), PNG);

    expect(outcome).toEqual({ kind: 'rasterization_failed', cause });
  });
});
