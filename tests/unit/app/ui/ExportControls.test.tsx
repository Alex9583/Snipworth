import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportControls } from '@/adapters/primary/app/ui/ExportControls';

interface RenderOpts {
  scale?: 1 | 2 | 4;
  format?: 'png' | 'svg';
  onScaleChange?: (s: 1 | 2 | 4) => void;
  onFormatChange?: (f: 'png' | 'svg') => void;
  onCopy?: () => void;
  onDownload?: () => void;
}

function renderControls(opts: RenderOpts = {}) {
  return render(
    <ExportControls
      scale={opts.scale ?? 2}
      format={opts.format ?? 'png'}
      onScaleChange={opts.onScaleChange ?? vi.fn()}
      onFormatChange={opts.onFormatChange ?? vi.fn()}
      onCopy={opts.onCopy ?? vi.fn()}
      onDownload={opts.onDownload ?? vi.fn()}
    />,
  );
}

describe('ExportControls', () => {
  it('should_render_radiogroups_for_format_and_quality', () => {
    renderControls();

    expect(screen.getByRole('radiogroup', { name: 'Format' })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Quality' })).toBeInTheDocument();
  });

  it('should_mark_the_active_format_as_aria_checked', () => {
    renderControls({ format: 'svg' });

    expect(screen.getByRole('radio', { name: 'PNG' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: 'SVG' })).toHaveAttribute('aria-checked', 'true');
  });

  it('should_mark_the_active_scale_as_aria_checked', () => {
    renderControls({ scale: 4 });

    expect(screen.getByRole('radio', { name: '1×' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: '2×' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: '4×' })).toHaveAttribute('aria-checked', 'true');
  });

  it('should_emit_onScaleChange_when_user_picks_a_different_scale', async () => {
    const user = userEvent.setup();
    const onScaleChange = vi.fn();
    renderControls({ scale: 2, onScaleChange });

    await user.click(screen.getByRole('radio', { name: '4×' }));

    expect(onScaleChange).toHaveBeenCalledWith(4);
  });

  it('should_emit_onFormatChange_when_user_picks_a_different_format', async () => {
    const user = userEvent.setup();
    const onFormatChange = vi.fn();
    renderControls({ format: 'png', onFormatChange });

    await user.click(screen.getByRole('radio', { name: 'SVG' }));

    expect(onFormatChange).toHaveBeenCalledWith('svg');
  });

  it('should_emit_onCopy_when_user_clicks_the_copy_button', async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    renderControls({ onCopy });

    await user.click(screen.getByRole('button', { name: 'Copy image' }));

    expect(onCopy).toHaveBeenCalledOnce();
  });

  it('should_emit_onDownload_when_user_clicks_the_download_button', async () => {
    const user = userEvent.setup();
    const onDownload = vi.fn();
    renderControls({ onDownload });

    await user.click(screen.getByRole('button', { name: /download/i }));

    expect(onDownload).toHaveBeenCalledOnce();
  });
});
