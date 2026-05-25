import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { LinkOpener } from '@/adapters/primary/app/LinkOpener';
import { TabTopNav } from '@/adapters/primary/app/ui/TabTopNav';

class SpyLinkOpener implements LinkOpener {
  public readonly opened: string[] = [];
  open(url: string): void {
    this.opened.push(url);
  }
}

function noop(): void {
  /* intentionally empty */
}

describe('TabTopNav', () => {
  it('should_render_a_banner_landmark_for_screen_readers', () => {
    render(<TabTopNav activeView="editor" onChangeView={noop} />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('should_render_the_logo_with_the_brand_label', () => {
    render(<TabTopNav activeView="editor" onChangeView={noop} />);

    expect(screen.getByRole('img', { name: 'Snipworth logo' })).toBeInTheDocument();
  });

  it('should_render_the_wordmark_split_across_an_accent_prefix_and_a_neutral_suffix', () => {
    render(<TabTopNav activeView="editor" onChangeView={noop} />);

    expect(screen.getByText('Snip')).toBeInTheDocument();
  });

  it('should_render_the_provided_version_as_a_badge', () => {
    render(<TabTopNav activeView="editor" onChangeView={noop} version="9.9.9" />);

    expect(screen.getByText('v9.9.9')).toBeInTheDocument();
  });

  it('should_render_the_editor_library_and_about_sub_tabs', () => {
    render(<TabTopNav activeView="editor" onChangeView={noop} />);

    expect(screen.getByRole('tab', { name: 'Editor' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Library' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'About' })).toBeInTheDocument();
  });

  it('should_invoke_on_change_view_with_library_when_user_clicks_the_library_sub_tab', async () => {
    const user = userEvent.setup();
    const changes: string[] = [];
    render(
      <TabTopNav
        activeView="editor"
        onChangeView={(next) => {
          changes.push(next);
        }}
      />,
    );

    await user.click(screen.getByRole('tab', { name: 'Library' }));

    expect(changes).toEqual(['library']);
  });

  it('should_expose_an_accessible_name_for_the_sub_tab_list', () => {
    render(<TabTopNav activeView="editor" onChangeView={noop} />);

    expect(screen.getByRole('tablist', { name: 'Snipworth views' })).toBeInTheDocument();
  });

  it('should_show_the_editor_sub_tab_as_active_when_active_view_is_editor', () => {
    render(<TabTopNav activeView="editor" onChangeView={noop} />);

    expect(screen.getByRole('tab', { name: 'Editor' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'About' })).toHaveAttribute('aria-selected', 'false');
  });

  it('should_show_the_about_sub_tab_as_active_when_active_view_is_about', () => {
    render(<TabTopNav activeView="about" onChangeView={noop} />);

    expect(screen.getByRole('tab', { name: 'About' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Editor' })).toHaveAttribute('aria-selected', 'false');
  });

  it('should_invoke_on_change_view_with_about_when_user_clicks_the_about_sub_tab', async () => {
    const user = userEvent.setup();
    const changes: string[] = [];
    render(
      <TabTopNav
        activeView="editor"
        onChangeView={(next) => {
          changes.push(next);
        }}
      />,
    );

    await user.click(screen.getByRole('tab', { name: 'About' }));

    expect(changes).toEqual(['about']);
  });

  it('should_open_the_bmac_url_when_user_clicks_support', async () => {
    const user = userEvent.setup();
    const spy = new SpyLinkOpener();
    render(<TabTopNav activeView="editor" onChangeView={noop} linkOpener={spy} />);

    await user.click(screen.getByRole('button', { name: /support/i }));

    expect(spy.opened).toEqual([__SNIPWORTH_BMAC_URL__]);
  });

  it('should_open_the_repo_url_when_user_clicks_github', async () => {
    const user = userEvent.setup();
    const spy = new SpyLinkOpener();
    render(<TabTopNav activeView="editor" onChangeView={noop} linkOpener={spy} />);

    await user.click(screen.getByRole('button', { name: 'Open GitHub repository' }));

    expect(spy.opened).toEqual([__SNIPWORTH_REPO_URL__]);
  });
});
