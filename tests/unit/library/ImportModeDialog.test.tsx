import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ImportModeDialog } from '@/adapters/primary/library/ImportModeDialog';

function renderDialog(props: Partial<Parameters<typeof ImportModeDialog>[0]> = {}) {
  const onAdd = vi.fn();
  const onReplace = vi.fn();
  const onCancel = vi.fn();
  render(
    <ImportModeDialog
      open
      incomingCount={3}
      onAdd={onAdd}
      onReplace={onReplace}
      onCancel={onCancel}
      {...props}
    />,
  );
  return { onAdd, onReplace, onCancel };
}

describe('ImportModeDialog', () => {
  it('should_not_render_when_closed', () => {
    renderDialog({ open: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should_announce_the_incoming_draft_count', () => {
    renderDialog({ incomingCount: 3 });

    expect(screen.getByRole('dialog')).toHaveTextContent('3 drafts');
  });

  it('should_use_the_singular_noun_when_a_single_draft_is_incoming', () => {
    renderDialog({ incomingCount: 1 });

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('1 draft');
    expect(dialog).not.toHaveTextContent('1 drafts');
  });

  it('should_invoke_onAdd_when_the_add_action_is_chosen', async () => {
    const { onAdd } = renderDialog();

    await userEvent.click(screen.getByRole('button', { name: /add to library/i }));

    expect(onAdd).toHaveBeenCalledOnce();
  });

  it('should_invoke_onReplace_when_the_replace_action_is_chosen', async () => {
    const { onReplace } = renderDialog();

    await userEvent.click(screen.getByRole('button', { name: /replace library/i }));

    expect(onReplace).toHaveBeenCalledOnce();
  });

  it('should_invoke_onCancel_when_the_cancel_action_is_chosen', async () => {
    const { onCancel } = renderDialog();

    await userEvent.click(screen.getByRole('button', { name: /^cancel$/i }));

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('should_invoke_onCancel_when_escape_is_pressed', async () => {
    const { onCancel } = renderDialog();

    await userEvent.keyboard('{Escape}');

    expect(onCancel).toHaveBeenCalledOnce();
  });
});
