import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { LinkOpener } from '@/adapters/primary/app/LinkOpener';
import { Onboarding } from '@/adapters/primary/app/onboarding/Onboarding';

class SpyLinkOpener implements LinkOpener {
  readonly opened: string[] = [];
  open(url: string): void {
    this.opened.push(url);
  }
}

describe('Onboarding', () => {
  it('should_render_step_one_welcome_heading_by_default', () => {
    render(<Onboarding onComplete={vi.fn()} />);

    expect(screen.getByRole('heading', { name: /welcome to snipworth/i })).toBeInTheDocument();
  });

  it('should_advance_to_step_two_when_user_clicks_get_started', async () => {
    const user = userEvent.setup();
    render(<Onboarding onComplete={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /get started/i }));

    expect(screen.getByRole('heading', { name: /capture from anywhere/i })).toBeInTheDocument();
  });

  it('should_return_to_step_one_when_user_clicks_back_on_step_two', async () => {
    const user = userEvent.setup();
    render(<Onboarding onComplete={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /get started/i }));
    await user.click(screen.getByRole('button', { name: /back/i }));

    expect(screen.getByRole('heading', { name: /welcome to snipworth/i })).toBeInTheDocument();
  });

  it('should_advance_to_step_three_when_user_clicks_next_on_step_two', async () => {
    const user = userEvent.setup();
    render(<Onboarding onComplete={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /get started/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    expect(screen.getByRole('heading', { name: /free and open source/i })).toBeInTheDocument();
  });

  it('should_open_the_bmac_url_when_user_clicks_buy_me_a_coffee_on_step_three', async () => {
    const user = userEvent.setup();
    const linkOpener = new SpyLinkOpener();
    render(<Onboarding onComplete={vi.fn()} linkOpener={linkOpener} />);

    await user.click(screen.getByRole('button', { name: /get started/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));
    await user.click(screen.getByRole('button', { name: /buy me a coffee/i }));

    expect(linkOpener.opened).toEqual([__SNIPWORTH_BMAC_URL__]);
  });

  it('should_call_onComplete_when_user_clicks_start_using_snipworth', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<Onboarding onComplete={onComplete} />);

    await user.click(screen.getByRole('button', { name: /get started/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));
    await user.click(screen.getByRole('button', { name: /start using snipworth/i }));

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('should_announce_step_progress_to_screen_readers', async () => {
    const user = userEvent.setup();
    render(<Onboarding onComplete={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'Onboarding progress: step 1 of 3',
    );

    await user.click(screen.getByRole('button', { name: /get started/i }));

    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'Onboarding progress: step 2 of 3',
    );
  });
});
