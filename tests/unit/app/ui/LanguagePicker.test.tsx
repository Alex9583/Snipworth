import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LanguagePicker } from '@/adapters/primary/app/ui/LanguagePicker';

const noop = (): void => undefined;

describe('LanguagePicker', () => {
  it('should_call_onChange_with_the_selected_language_when_user_picks_one', async () => {
    const user = userEvent.setup();
    const picks: string[] = [];

    render(
      <LanguagePicker
        value="typescript"
        detection={{ kind: 'auto-detected' }}
        onChange={(next) => {
          picks.push(next);
        }}
      />,
    );

    await user.selectOptions(screen.getByRole('combobox', { name: /language/i }), 'rust');

    expect(picks).toEqual(['rust']);
  });

  it('should_render_an_auto_badge_when_detection_is_auto_detected', () => {
    render(
      <LanguagePicker value="typescript" detection={{ kind: 'auto-detected' }} onChange={noop} />,
    );

    expect(screen.getByText('auto')).toBeInTheDocument();
  });

  it('should_not_render_the_auto_badge_when_detection_is_manual', () => {
    render(<LanguagePicker value="typescript" detection={{ kind: 'manual' }} onChange={noop} />);

    expect(screen.queryByText('auto')).not.toBeInTheDocument();
  });

  it('should_not_render_any_badge_when_detection_is_idle', () => {
    render(<LanguagePicker value="plaintext" detection={{ kind: 'idle' }} onChange={noop} />);

    expect(screen.queryByText('auto')).not.toBeInTheDocument();
    expect(screen.queryByText('auto-detected fallback')).not.toBeInTheDocument();
  });

  it('should_render_the_fallback_badge_when_detection_is_fallback', () => {
    render(
      <LanguagePicker
        value="plaintext"
        detection={{ kind: 'fallback', cause: new Error('boom') }}
        onChange={noop}
      />,
    );

    expect(screen.getByText('auto-detected fallback')).toBeInTheDocument();
  });

  it('should_not_render_the_fallback_badge_when_detection_succeeded', () => {
    render(
      <LanguagePicker value="typescript" detection={{ kind: 'auto-detected' }} onChange={noop} />,
    );

    expect(screen.queryByText('auto-detected fallback')).not.toBeInTheDocument();
  });

  it('should_include_the_current_value_as_an_option_when_it_is_outside_the_curated_set', () => {
    render(<LanguagePicker value="ruby" detection={{ kind: 'auto-detected' }} onChange={noop} />);

    const select = screen.getByRole('combobox', { name: /language/i });
    expect(select).toHaveValue('ruby');
    expect(screen.getByRole('option', { name: 'ruby' })).toBeInTheDocument();
  });

  it('should_expose_an_aria_labelled_combobox', () => {
    render(
      <LanguagePicker value="typescript" detection={{ kind: 'auto-detected' }} onChange={noop} />,
    );

    expect(screen.getByRole('combobox', { name: /language/i })).toBeInTheDocument();
  });
});
