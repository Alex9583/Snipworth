import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PlatformRow } from '@/adapters/primary/library/PlatformRow';
import { platformDisplayLabel } from '@/adapters/primary/shared/platformLabels';
import { platforms } from '@/domain/drafts/Platform';

describe('PlatformRow', () => {
  it('should_render_exactly_six_chips_one_per_Platform_value', () => {
    render(<PlatformRow currentPlatform="x" onPlatformChange={vi.fn()} />);

    expect(platforms).toHaveLength(6);
    for (const platform of platforms) {
      expect(
        screen.getByRole('button', { name: platformDisplayLabel(platform) }),
      ).toBeInTheDocument();
    }
  });

  it('should_mark_only_the_currentPlatform_chip_as_aria_pressed_true', () => {
    render(<PlatformRow currentPlatform="linkedin" onPlatformChange={vi.fn()} />);

    for (const platform of platforms) {
      const chip = screen.getByRole('button', { name: platformDisplayLabel(platform) });
      expect(chip).toHaveAttribute('aria-pressed', String(platform === 'linkedin'));
    }
  });

  it('should_invoke_onPlatformChange_with_the_chip_platform_when_user_clicks_a_chip', async () => {
    const onPlatformChange = vi.fn();
    const user = userEvent.setup();
    render(<PlatformRow currentPlatform="x" onPlatformChange={onPlatformChange} />);

    await user.click(screen.getByRole('button', { name: platformDisplayLabel('instagram') }));

    expect(onPlatformChange).toHaveBeenCalledExactlyOnceWith('instagram');
  });

  it('should_render_the_dimensions_text_for_the_active_platform_preset', () => {
    render(<PlatformRow currentPlatform="x" onPlatformChange={vi.fn()} />);

    expect(screen.getByText('1200 × 675')).toBeInTheDocument();
  });

  it('should_render_em_dashes_when_currentPlatform_has_no_pixel_preset', () => {
    render(<PlatformRow currentPlatform="generic" onPlatformChange={vi.fn()} />);

    expect(screen.getByText('— × —')).toBeInTheDocument();
  });
});
