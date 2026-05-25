import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DeleteDraftDialog } from '@/adapters/primary/library/DeleteDraftDialog';

describe('DeleteDraftDialog', () => {
  it('should_render_nothing_when_open_is_false', () => {
    const { container } = render(
      <DeleteDraftDialog open={false} onCancel={vi.fn()} onConfirm={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('should_expose_a_modal_dialog_role_whose_accessible_name_is_the_title_heading', () => {
    render(<DeleteDraftDialog open onCancel={vi.fn()} onConfirm={vi.fn()} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName(/delete this draft/i);
  });

  it('should_invoke_onCancel_when_user_clicks_the_cancel_button', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(<DeleteDraftDialog open onCancel={onCancel} onConfirm={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('should_invoke_onConfirm_when_user_clicks_the_delete_button', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(<DeleteDraftDialog open onCancel={vi.fn()} onConfirm={onConfirm} />);
    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('should_invoke_onCancel_when_user_presses_Escape', () => {
    const onCancel = vi.fn();
    render(<DeleteDraftDialog open onCancel={onCancel} onConfirm={vi.fn()} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onCancel).toHaveBeenCalledOnce();
  });
});
