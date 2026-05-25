import { describe, it, expect } from 'vitest';

import { computeScaleFactor } from '@/adapters/primary/app/computeScaleFactor';

describe('computeScaleFactor', () => {
  it('should_scale_up_when_content_is_smaller_than_canvas_with_zero_padding', () => {
    const factor = computeScaleFactor(400, 300, 800, 600, 0);

    expect(factor).toBe(2);
  });

  it('should_scale_down_when_content_width_exceeds_canvas_width', () => {
    const factor = computeScaleFactor(1600, 300, 800, 600, 0);

    expect(factor).toBe(0.5);
  });

  it('should_scale_down_when_content_height_exceeds_canvas_height', () => {
    const factor = computeScaleFactor(400, 1200, 800, 600, 0);

    expect(factor).toBe(0.5);
  });

  it('should_use_the_most_constraining_axis_when_both_overflow', () => {
    const factor = computeScaleFactor(1600, 1200, 800, 600, 0);

    expect(factor).toBe(0.5);
  });

  it('should_return_1_when_content_matches_canvas_exactly_with_zero_padding', () => {
    const factor = computeScaleFactor(800, 600, 800, 600, 0);

    expect(factor).toBe(1);
  });

  it('should_reduce_available_space_when_padding_is_applied', () => {
    const factor = computeScaleFactor(800, 600, 800, 600, 10);

    expect(factor).toBe(0.9);
  });

  it('should_scale_up_content_to_fill_canvas_minus_padding', () => {
    const factor = computeScaleFactor(400, 300, 800, 600, 10);

    expect(factor).toBeCloseTo(1.8);
  });

  it('should_leave_half_the_canvas_empty_when_padding_is_50', () => {
    const factor = computeScaleFactor(800, 600, 800, 600, 50);

    expect(factor).toBe(0.5);
  });
});
