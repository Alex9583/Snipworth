import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { OnboardingRequiredNotice } from '@/adapters/primary/app/OnboardingRequiredNotice';

describe('OnboardingRequiredNotice', () => {
  it('should_render_a_heading_explaining_that_onboarding_is_required', () => {
    render(<OnboardingRequiredNotice />);

    expect(
      screen.getByRole('heading', { level: 1, name: /onboarding required/i }),
    ).toBeInTheDocument();
  });

  it('should_explain_why_the_user_sees_this_screen', () => {
    render(<OnboardingRequiredNotice />);

    expect(screen.getByText(/snipworth needs a quick setup/i)).toBeInTheDocument();
  });

  it('should_render_the_instructions_to_open_the_side_panel', () => {
    render(<OnboardingRequiredNotice />);

    expect(
      screen.getByText(/click the snipworth icon in your browser toolbar/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/walk through the welcome screens/i)).toBeInTheDocument();
    expect(screen.getByText(/reload this tab/i)).toBeInTheDocument();
  });

  it('should_render_the_snipworth_logo', () => {
    render(<OnboardingRequiredNotice />);

    expect(screen.getByRole('img', { name: /snipworth logo/i })).toBeInTheDocument();
  });
});
