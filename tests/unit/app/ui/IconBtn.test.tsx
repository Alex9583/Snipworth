import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IconBtn } from '@/adapters/primary/app/ui/IconBtn';

describe('IconBtn', () => {
  it('should_expose_the_label_as_the_accessible_name', () => {
    render(
      <IconBtn label="Open GitHub">
        <span aria-hidden>★</span>
      </IconBtn>,
    );
    expect(screen.getByRole('button', { name: 'Open GitHub' })).toBeInTheDocument();
  });

  it('should_invoke_onClick_when_user_clicks_the_button', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <IconBtn label="Action" onClick={onClick}>
        <span aria-hidden>★</span>
      </IconBtn>,
    );
    await user.click(screen.getByRole('button', { name: 'Action' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('should_not_invoke_onClick_when_button_is_disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <IconBtn label="Off" disabled onClick={onClick}>
        <span aria-hidden>★</span>
      </IconBtn>,
    );
    await user.click(screen.getByRole('button', { name: 'Off' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});
