import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Switch } from '@/adapters/primary/app/ui/Switch';

describe('Switch', () => {
  it('should_render_aria_checked_false_when_checked_prop_is_false', () => {
    render(<Switch checked={false} onChange={vi.fn()} label="Dark mode" />);
    expect(screen.getByRole('switch', { name: 'Dark mode' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('should_render_aria_checked_true_when_checked_prop_is_true', () => {
    render(<Switch checked={true} onChange={vi.fn()} label="Dark mode" />);
    expect(screen.getByRole('switch', { name: 'Dark mode' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('should_call_onChange_with_the_inverse_state_when_user_clicks_the_switch', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} label="Dark mode" />);
    await user.click(screen.getByRole('switch', { name: 'Dark mode' }));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
