import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

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
});
