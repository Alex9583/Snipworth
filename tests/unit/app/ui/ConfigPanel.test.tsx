import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConfigPanel } from '@/adapters/primary/app/ui/ConfigPanel';
import { RenderConfig, type RenderConfigSnapshot } from '@/domain/rendering/RenderConfig';

const defaults: RenderConfigSnapshot = RenderConfig.default().toSnapshot();

const noop = (): void => undefined;

function recordingPatchHandler() {
  const patches: Partial<RenderConfigSnapshot>[] = [];
  return {
    patches,
    onChange: (patch: Partial<RenderConfigSnapshot>): void => {
      patches.push(patch);
    },
  };
}

describe('ConfigPanel', () => {
  it('should_render_accessible_controls_for_each_editable_field', () => {
    render(<ConfigPanel value={defaults} onChange={noop} />);

    expect(screen.getByLabelText('Theme')).toBeInTheDocument();
    expect(screen.getByLabelText('Font family')).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Font size' })).toBeInTheDocument();
    expect(screen.getByLabelText('Background color')).toBeInTheDocument();
  });

  it('should_emit_a_theme_patch_when_user_selects_a_different_theme', async () => {
    const user = userEvent.setup();
    const handler = recordingPatchHandler();
    render(<ConfigPanel value={defaults} onChange={handler.onChange} />);

    await user.selectOptions(screen.getByLabelText('Theme'), 'github-light');

    expect(handler.patches).toEqual([{ theme: 'github-light' }]);
  });

  it('should_emit_a_font_size_patch_when_user_drags_the_slider', () => {
    const handler = recordingPatchHandler();
    render(<ConfigPanel value={defaults} onChange={handler.onChange} />);

    fireEvent.change(screen.getByRole('slider', { name: 'Font size' }), {
      target: { value: '18' },
    });

    expect(handler.patches).toEqual([{ fontSize: 18 }]);
  });

  it('should_emit_a_solid_background_patch_when_user_picks_a_color', () => {
    const handler = recordingPatchHandler();
    render(<ConfigPanel value={defaults} onChange={handler.onChange} />);

    fireEvent.change(screen.getByLabelText('Background color'), {
      target: { value: '#abcdef' },
    });

    expect(handler.patches).toEqual([{ background: { type: 'solid', color: '#abcdef' } }]);
  });

  it('should_seed_the_color_picker_from_the_current_solid_background', () => {
    const value: RenderConfigSnapshot = {
      ...defaults,
      background: { type: 'solid', color: '#123456' },
    };
    render(<ConfigPanel value={value} onChange={noop} />);

    expect(screen.getByLabelText('Background color')).toHaveValue('#123456');
  });

  it('should_include_the_current_theme_as_an_option_when_it_is_outside_the_curated_set', () => {
    const value: RenderConfigSnapshot = { ...defaults, theme: 'unknown-theme' };
    render(<ConfigPanel value={value} onChange={noop} />);

    expect(screen.getByLabelText('Theme')).toHaveValue('unknown-theme');
    expect(screen.getByRole('option', { name: 'unknown-theme' })).toBeInTheDocument();
  });

  it('should_group_curated_themes_under_dark_and_light_optgroups', () => {
    render(<ConfigPanel value={defaults} onChange={noop} />);

    const themeSelect = screen.getByLabelText('Theme');
    const darkGroup = themeSelect.querySelector('optgroup[label="Dark"]');
    const lightGroup = themeSelect.querySelector('optgroup[label="Light"]');

    expect(darkGroup).not.toBeNull();
    expect(lightGroup).not.toBeNull();
    expect(darkGroup?.querySelector('option[value="dracula"]')).not.toBeNull();
    expect(lightGroup?.querySelector('option[value="github-light"]')).not.toBeNull();
  });

  it('should_emit_a_theme_patch_when_user_selects_a_theme_from_the_dark_group', async () => {
    const user = userEvent.setup();
    const handler = recordingPatchHandler();
    render(<ConfigPanel value={defaults} onChange={handler.onChange} />);

    await user.selectOptions(screen.getByLabelText('Theme'), 'dracula');

    expect(handler.patches).toEqual([{ theme: 'dracula' }]);
  });

  it('should_display_a_pixel_hint_next_to_the_font_size_slider', () => {
    const value: RenderConfigSnapshot = { ...defaults, fontSize: 18 };
    render(<ConfigPanel value={value} onChange={noop} />);

    expect(screen.getByText('18 px')).toBeInTheDocument();
  });
});
