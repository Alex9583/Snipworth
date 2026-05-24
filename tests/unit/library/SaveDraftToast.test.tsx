import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AUTO_DISMISS_MS, SaveDraftToast } from '@/adapters/primary/library/SaveDraftToast';
import { SAVE_DRAFT_TOAST } from '@/adapters/primary/library/SaveDraftToast.strings';

describe('SaveDraftToast', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should_render_the_toast_message_and_an_open_button_when_visible_is_true', () => {
    render(<SaveDraftToast visible={true} onOpen={vi.fn()} onDismiss={vi.fn()} />);

    expect(screen.getByText(SAVE_DRAFT_TOAST.message)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: SAVE_DRAFT_TOAST.openButton })).toBeInTheDocument();
  });

  it('should_invoke_onOpen_then_onDismiss_when_user_clicks_the_open_button', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onDismiss = vi.fn();

    render(<SaveDraftToast visible={true} onOpen={onOpen} onDismiss={onDismiss} />);

    await user.click(screen.getByRole('button', { name: SAVE_DRAFT_TOAST.openButton }));

    expect(onOpen).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledOnce();
    const [openOrder] = onOpen.mock.invocationCallOrder;
    const [dismissOrder] = onDismiss.mock.invocationCallOrder;
    if (openOrder === undefined || dismissOrder === undefined) {
      throw new Error('expected both spies to record their call order');
    }
    expect(openOrder).toBeLessThan(dismissOrder);
  });

  it('should_invoke_onDismiss_exactly_once_after_the_auto_dismiss_window_elapses', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();

    render(<SaveDraftToast visible={true} onOpen={vi.fn()} onDismiss={onDismiss} />);

    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(AUTO_DISMISS_MS);
    });
    expect(onDismiss).toHaveBeenCalledOnce();

    act(() => {
      vi.advanceTimersByTime(AUTO_DISMISS_MS);
    });
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('should_not_invoke_onDismiss_when_the_toast_is_unmounted_before_the_auto_dismiss_window_elapses', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();

    const { unmount } = render(
      <SaveDraftToast visible={true} onOpen={vi.fn()} onDismiss={onDismiss} />,
    );

    unmount();
    act(() => {
      vi.advanceTimersByTime(AUTO_DISMISS_MS);
    });

    expect(onDismiss).not.toHaveBeenCalled();
  });
});
