import { describe, expect, it } from 'vitest';

import { buildExportFilename } from '@/domain/export/buildExportFilename';

describe('buildExportFilename', () => {
  it('should_format_filename_with_iso_datetime_and_png_extension_when_format_is_png', () => {
    const at = new Date('2026-05-09T14:23:05.789Z');

    expect(buildExportFilename(at, 'png')).toBe('snipworth-2026-05-09-14-23-05.png');
  });

  it('should_format_filename_with_iso_datetime_and_svg_extension_when_format_is_svg', () => {
    const at = new Date('2026-05-09T14:23:05.789Z');

    expect(buildExportFilename(at, 'svg')).toBe('snipworth-2026-05-09-14-23-05.svg');
  });

  it('should_drop_milliseconds_and_use_utc_components', () => {
    const at = new Date('2026-12-31T23:59:59.999Z');

    expect(buildExportFilename(at, 'png')).toBe('snipworth-2026-12-31-23-59-59.png');
  });

  it('should_pad_single_digit_components_with_a_leading_zero', () => {
    const at = new Date('2026-01-02T03:04:05.000Z');

    expect(buildExportFilename(at, 'png')).toBe('snipworth-2026-01-02-03-04-05.png');
  });
});
