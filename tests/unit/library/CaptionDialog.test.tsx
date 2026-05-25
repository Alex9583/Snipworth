import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CaptionDialog } from '@/adapters/primary/library/CaptionDialog';
import { CAPTION_DIALOG } from '@/adapters/primary/library/CaptionDialog.strings';

const noop = (): void => undefined;

const DEFAULTS = {
  open: true,
  caption: '',
  hashtagsRaw: '',
  platform: 'x' as const,
  onCaptionChange: noop,
  onHashtagsRawChange: noop,
  onClose: noop,
};

describe('CaptionDialog', () => {
  it('should_render_nothing_when_open_is_false', () => {
    render(<CaptionDialog {...DEFAULTS} open={false} />);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('should_render_a_dialog_when_open_is_true', () => {
    render(<CaptionDialog {...DEFAULTS} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(CAPTION_DIALOG.title)).toBeInTheDocument();
  });

  it('should_call_onClose_when_escape_is_pressed', () => {
    const onClose = vi.fn();
    render(<CaptionDialog {...DEFAULTS} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('should_call_onClose_when_backdrop_is_clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CaptionDialog {...DEFAULTS} onClose={onClose} />);

    await user.click(screen.getByLabelText('Close'));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('should_call_onClose_when_close_button_is_clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CaptionDialog {...DEFAULTS} onClose={onClose} />);

    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: CAPTION_DIALOG.closeButton }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('should_call_onCaptionChange_when_user_types_in_the_textarea', async () => {
    const user = userEvent.setup();
    const onCaptionChange = vi.fn();
    render(<CaptionDialog {...DEFAULTS} onCaptionChange={onCaptionChange} />);

    await user.type(screen.getByRole('textbox', { name: CAPTION_DIALOG.captionLabel }), 'H');

    expect(onCaptionChange).toHaveBeenLastCalledWith('H');
  });

  it('should_display_character_counter_reflecting_caption_and_hashtags_for_platform_with_limit', () => {
    render(<CaptionDialog {...DEFAULTS} caption="Hello" hashtagsRaw="#react" platform="x" />);

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '11');
    expect(bar).toHaveAttribute('aria-valuemax', '280');
  });

  it('should_not_display_character_counter_when_platform_has_no_limit', () => {
    render(<CaptionDialog {...DEFAULTS} platform="generic" />);

    expect(screen.queryByRole('progressbar')).toBeNull();
  });
});
