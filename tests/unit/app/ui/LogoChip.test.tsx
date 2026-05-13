import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LogoChip } from '@/adapters/primary/app/ui/LogoChip';

describe('LogoChip', () => {
  it('should_render_an_accessible_image_when_a_label_is_provided', () => {
    render(<LogoChip label="Snipworth logo" />);
    expect(screen.getByRole('img', { name: 'Snipworth logo' })).toBeInTheDocument();
  });

  it('should_render_a_decorative_mark_when_no_label_is_provided', () => {
    render(<LogoChip />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
