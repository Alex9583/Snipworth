import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AboutView } from '@/adapters/primary/app/AboutView';
import type { LinkOpener } from '@/adapters/primary/app/LinkOpener';

class SpyLinkOpener implements LinkOpener {
  public readonly opened: string[] = [];
  open(url: string): void {
    this.opened.push(url);
  }
}

describe('AboutView', () => {
  it('should_render_a_labelled_section_with_the_brand_heading', () => {
    render(<AboutView />);

    expect(screen.getByRole('heading', { level: 1, name: /snipworth/i })).toBeInTheDocument();
  });

  it('should_render_the_provided_version_as_a_badge', () => {
    render(<AboutView version="1.2.3" />);

    expect(screen.getByText('v1.2.3')).toBeInTheDocument();
  });

  it('should_render_the_mit_license_badge', () => {
    render(<AboutView />);

    expect(screen.getByText('MIT License')).toBeInTheDocument();
  });

  it('should_render_the_tagline', () => {
    render(<AboutView />);

    expect(screen.getByText(/turn code snippets into beautiful images/i)).toBeInTheDocument();
  });

  it('should_render_the_github_card_with_its_title_and_subtitle', () => {
    render(<AboutView />);

    expect(screen.getByRole('button', { name: /open source on github/i })).toBeInTheDocument();
    expect(screen.getByText('Star the repo · file issues · contribute')).toBeInTheDocument();
  });

  it('should_render_the_bmac_card_with_its_title_and_subtitle', () => {
    render(<AboutView />);

    expect(screen.getByRole('button', { name: /buy me a coffee/i })).toBeInTheDocument();
    expect(screen.getByText('Support ongoing development')).toBeInTheDocument();
  });

  it('should_open_the_repo_url_when_user_clicks_the_github_card', async () => {
    const user = userEvent.setup();
    const spy = new SpyLinkOpener();
    render(<AboutView linkOpener={spy} />);

    await user.click(screen.getByRole('button', { name: /open source on github/i }));

    expect(spy.opened).toEqual([__SNIPWORTH_REPO_URL__]);
  });

  it('should_open_the_bmac_url_when_user_clicks_the_bmac_card', async () => {
    const user = userEvent.setup();
    const spy = new SpyLinkOpener();
    render(<AboutView linkOpener={spy} />);

    await user.click(screen.getByRole('button', { name: /buy me a coffee/i }));

    expect(spy.opened).toEqual([__SNIPWORTH_BMAC_URL__]);
  });

  it('should_render_the_made_with_heart_footer_text', () => {
    render(<AboutView />);

    expect(screen.getByText(/made with ♥/i)).toBeInTheDocument();
  });
});
