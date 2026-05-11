#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { Resvg } from '@resvg/resvg-js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const SOURCE = resolve(here, 'icon-source.svg');
const SIZES = [16, 32, 48, 128];

const svg = readFileSync(SOURCE, 'utf8');

for (const size of SIZES) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
  const pngBuffer = resvg.render().asPng();
  const out = resolve(root, `public/icons/icon-${size}.png`);
  writeFileSync(out, pngBuffer);
  process.stdout.write(`generated ${out} (${size}px, ${pngBuffer.length} bytes)\n`);
}
