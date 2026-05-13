import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AppHeader } from '@/adapters/primary/app/ui/AppHeader';

describe('AppHeader', () => {
  it('should_render_the_logo_with_the_brand_label', () => {
    render(<AppHeader />);
    expect(screen.getByRole('img', { name: 'Snipworth logo' })).toBeInTheDocument();
  });

  it('should_render_the_wordmark_text_split_across_an_accent_prefix_and_a_neutral_suffix', () => {
    const { container } = render(<AppHeader />);
    expect(container.textContent).toContain('Snipworth');
    expect(screen.getByText('Snip')).toBeInTheDocument();
  });

  it('should_render_a_banner_landmark_for_screen_readers', () => {
    render(<AppHeader />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('should_render_the_provided_version_as_a_badge_next_to_the_wordmark', () => {
    render(<AppHeader version="9.9.9" />);
    expect(screen.getByText('v9.9.9')).toBeInTheDocument();
  });

  it('should_render_the_open_in_full_tab_button_when_a_handler_is_provided', () => {
    render(<AppHeader onOpenFullTab={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Open in full tab' })).toBeInTheDocument();
  });

  it('should_not_render_the_open_in_full_tab_button_when_no_handler_is_provided', () => {
    render(<AppHeader />);
    expect(screen.queryByRole('button', { name: 'Open in full tab' })).toBeNull();
  });

  it('should_invoke_the_open_full_tab_handler_when_user_clicks_the_button', async () => {
    const user = userEvent.setup();
    const clicks: number[] = [];
    render(
      <AppHeader
        onOpenFullTab={() => {
          clicks.push(1);
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Open in full tab' }));

    expect(clicks).toHaveLength(1);
  });
});
