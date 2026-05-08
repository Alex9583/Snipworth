import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigPanel, type ConfigPanelValue } from '@/adapters/primary/app/ui/ConfigPanel';

const defaults: ConfigPanelValue = {
  theme: 'github-dark',
  fontFamily: 'JetBrains Mono',
  fontSize: 14,
  paddingX: 32,
  paddingY: 32,
  background: '#1C1C21',
};

describe('ConfigPanel', () => {
  it('should_render_accessible_controls_for_each_editable_field', () => {
    render(<ConfigPanel value={defaults} onChange={vi.fn()} />);

    expect(screen.getByLabelText('Theme')).toBeInTheDocument();
    expect(screen.getByLabelText('Font family')).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Font size' })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Padding X' })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Padding Y' })).toBeInTheDocument();
    expect(screen.getByLabelText('Background color')).toBeInTheDocument();
  });

  it('should_emit_a_theme_patch_when_user_selects_a_different_theme', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ConfigPanel value={defaults} onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText('Theme'), 'github-light');

    expect(onChange).toHaveBeenCalledWith({ theme: 'github-light' });
  });

  it('should_emit_a_font_size_patch_when_user_drags_the_slider', () => {
    const onChange = vi.fn();
    render(<ConfigPanel value={defaults} onChange={onChange} />);

    fireEvent.change(screen.getByRole('slider', { name: 'Font size' }), {
      target: { value: '18' },
    });

    expect(onChange).toHaveBeenCalledWith({ fontSize: 18 });
  });

  it('should_emit_a_background_patch_when_user_picks_a_color', () => {
    const onChange = vi.fn();
    render(<ConfigPanel value={defaults} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Background color'), {
      target: { value: '#abcdef' },
    });

    expect(onChange).toHaveBeenCalledWith({ background: '#abcdef' });
  });
});
