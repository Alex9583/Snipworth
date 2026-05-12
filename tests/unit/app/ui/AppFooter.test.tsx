import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { LinkOpener } from '@/adapters/primary/app/LinkOpener';
import { AppFooter } from '@/adapters/primary/app/ui/AppFooter';

class SpyLinkOpener implements LinkOpener {
  public readonly opened: string[] = [];
  open(url: string): void {
    this.opened.push(url);
  }
}

describe('AppFooter', () => {
  it('should_render_a_contentinfo_landmark_for_screen_readers', () => {
    render(<AppFooter />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('should_render_the_support_button_with_an_accessible_name', () => {
    render(<AppFooter />);
    expect(screen.getByRole('button', { name: /support/i })).toBeInTheDocument();
  });

  it('should_render_the_github_icon_button_with_an_accessible_name', () => {
    render(<AppFooter />);
    expect(screen.getByRole('button', { name: 'Open GitHub repository' })).toBeInTheDocument();
  });

  it('should_open_the_bmac_url_when_user_clicks_support', async () => {
    const user = userEvent.setup();
    const spy = new SpyLinkOpener();
    render(<AppFooter linkOpener={spy} />);

    await user.click(screen.getByRole('button', { name: /support/i }));

    expect(spy.opened).toEqual([__SNIPWORTH_BMAC_URL__]);
  });

  it('should_open_the_repo_url_when_user_clicks_github', async () => {
    const user = userEvent.setup();
    const spy = new SpyLinkOpener();
    render(<AppFooter linkOpener={spy} />);

    await user.click(screen.getByRole('button', { name: 'Open GitHub repository' }));

    expect(spy.opened).toEqual([__SNIPWORTH_REPO_URL__]);
  });
});
