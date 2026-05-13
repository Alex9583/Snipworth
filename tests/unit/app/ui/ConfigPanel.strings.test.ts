import { describe, it, expect } from 'vitest';
import { pxHintLabel } from '@/adapters/primary/app/ui/ConfigPanel.strings';

describe('pxHintLabel', () => {
  it('should_format_a_pixel_count_with_a_unit_suffix', () => {
    expect(pxHintLabel(14)).toBe('14 px');
  });

  it('should_format_zero_pixels', () => {
    expect(pxHintLabel(0)).toBe('0 px');
  });

  it('should_format_a_large_pixel_count', () => {
    expect(pxHintLabel(256)).toBe('256 px');
  });
});
