import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CaptionBar } from '@/adapters/primary/library/CaptionBar';
import { CAPTION_BAR } from '@/adapters/primary/library/CaptionBar.strings';

import type { Platform } from '@/domain/drafts/Platform';

interface ControlledProps {
  readonly initialCaption?: string;
  readonly platform?: Platform;
  readonly onCaptionChange?: (caption: string) => void;
  readonly onHashtagsChange?: (hashtags: readonly string[]) => void;
}

function ControlledCaptionBar({
  initialCaption = '',
  platform = 'x',
  onCaptionChange,
  onHashtagsChange,
}: ControlledProps = {}) {
  const [caption, setCaption] = useState(initialCaption);
  return (
    <CaptionBar
      caption={caption}
      platform={platform}
      onCaptionChange={(next) => {
        setCaption(next);
        onCaptionChange?.(next);
      }}
      onHashtagsChange={onHashtagsChange ?? (() => undefined)}
    />
  );
}

describe('CaptionBar', () => {
  it('should_invoke_onCaptionChange_with_the_typed_value_when_user_types_in_the_caption_textarea', async () => {
    const user = userEvent.setup();
    const onCaptionChange = vi.fn();

    render(<ControlledCaptionBar onCaptionChange={onCaptionChange} />);

    await user.type(screen.getByRole('textbox', { name: CAPTION_BAR.captionLabel }), 'Hello world');

    expect(onCaptionChange).toHaveBeenLastCalledWith('Hello world');
  });

  it('should_invoke_onHashtagsChange_with_the_split_tokens_when_user_types_hashtags_separated_by_whitespace', async () => {
    const user = userEvent.setup();
    const onHashtagsChange = vi.fn();

    render(<ControlledCaptionBar onHashtagsChange={onHashtagsChange} />);

    await user.type(
      screen.getByRole('textbox', { name: CAPTION_BAR.hashtagsLabel }),
      '#typescript #react',
    );

    expect(onHashtagsChange).toHaveBeenLastCalledWith(['#typescript', '#react']);
  });

  it('should_render_used_over_limit_when_platform_has_a_char_limit', async () => {
    const user = userEvent.setup();

    render(<ControlledCaptionBar initialCaption="Hello" platform="x" />);
    await user.type(
      screen.getByRole('textbox', { name: CAPTION_BAR.hashtagsLabel }),
      '#typescript #react',
    );

    expect(screen.getByText('23 / 280')).toBeInTheDocument();
  });

  it('should_carry_data_state_warning_when_usage_reaches_80_percent_of_limit', () => {
    render(<ControlledCaptionBar initialCaption={'a'.repeat(224)} platform="x" />);

    expect(screen.getByText('224 / 280')).toHaveAttribute('data-state', 'warning');
  });

  it('should_carry_data_state_error_when_usage_exceeds_100_percent_of_limit', () => {
    render(<ControlledCaptionBar initialCaption={'a'.repeat(281)} platform="x" />);

    expect(screen.getByText('281 / 280')).toHaveAttribute('data-state', 'error');
  });

  it('should_render_no_counter_when_platform_limit_is_null', () => {
    render(<ControlledCaptionBar platform="generic" />);

    expect(screen.queryByTestId('character-counter')).toBeNull();
  });

  it('should_expose_a_progressbar_with_aria_valuenow_and_aria_valuemax_when_platform_has_a_char_limit', () => {
    render(<ControlledCaptionBar initialCaption={'a'.repeat(224)} platform="x" />);

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '224');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '280');
  });

  it('should_render_a_hint_with_platform_label_and_remaining_count_when_limit_is_not_null', () => {
    render(<ControlledCaptionBar initialCaption={'a'.repeat(247)} platform="x" />);

    const hint = screen.getByTestId('character-counter-hint');
    expect(hint).toHaveTextContent(/\bX\b/);
    expect(hint).toHaveTextContent('33');
  });
});
