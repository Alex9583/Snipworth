import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Segmented } from '@/adapters/primary/app/ui/Segmented';

const formatOptions = [
  { value: 'png', label: 'PNG' },
  { value: 'svg', label: 'SVG' },
] as const;

const scaleOptions = [
  { value: 1, label: '1×' },
  { value: 2, label: '2×' },
  { value: 4, label: '4×' },
] as const;

describe('Segmented', () => {
  it('should_render_a_radiogroup_with_the_provided_label', () => {
    render(<Segmented label="Format" value="png" options={formatOptions} onChange={vi.fn()} />);

    expect(screen.getByRole('radiogroup', { name: 'Format' })).toBeInTheDocument();
  });

  it('should_render_a_radio_role_for_each_option', () => {
    render(<Segmented label="Format" value="png" options={formatOptions} onChange={vi.fn()} />);

    expect(screen.getByRole('radio', { name: 'PNG' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'SVG' })).toBeInTheDocument();
  });

  it('should_mark_only_the_selected_option_as_aria_checked', () => {
    render(<Segmented label="Format" value="svg" options={formatOptions} onChange={vi.fn()} />);

    expect(screen.getByRole('radio', { name: 'PNG' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: 'SVG' })).toHaveAttribute('aria-checked', 'true');
  });

  it('should_set_tabindex_zero_only_on_the_selected_option', () => {
    render(<Segmented label="Quality" value={2} options={scaleOptions} onChange={vi.fn()} />);

    expect(screen.getByRole('radio', { name: '1×' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('radio', { name: '2×' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('radio', { name: '4×' })).toHaveAttribute('tabindex', '-1');
  });

  it('should_emit_onChange_with_the_clicked_option_value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Segmented label="Quality" value={1} options={scaleOptions} onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: '4×' }));

    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('should_select_the_next_option_when_user_presses_ArrowRight', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Segmented label="Quality" value={1} options={scaleOptions} onChange={onChange} />);
    screen.getByRole('radio', { name: '1×' }).focus();

    await user.keyboard('{ArrowRight}');

    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('should_select_the_previous_option_when_user_presses_ArrowLeft', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Segmented label="Quality" value={4} options={scaleOptions} onChange={onChange} />);
    screen.getByRole('radio', { name: '4×' }).focus();

    await user.keyboard('{ArrowLeft}');

    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('should_wrap_to_the_first_option_when_pressing_ArrowRight_on_the_last', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Segmented label="Quality" value={4} options={scaleOptions} onChange={onChange} />);
    screen.getByRole('radio', { name: '4×' }).focus();

    await user.keyboard('{ArrowRight}');

    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('should_wrap_to_the_last_option_when_pressing_ArrowLeft_on_the_first', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Segmented label="Quality" value={1} options={scaleOptions} onChange={onChange} />);
    screen.getByRole('radio', { name: '1×' }).focus();

    await user.keyboard('{ArrowLeft}');

    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('should_jump_to_the_first_option_when_user_presses_Home', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Segmented label="Quality" value={4} options={scaleOptions} onChange={onChange} />);
    screen.getByRole('radio', { name: '4×' }).focus();

    await user.keyboard('{Home}');

    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('should_jump_to_the_last_option_when_user_presses_End', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Segmented label="Quality" value={1} options={scaleOptions} onChange={onChange} />);
    screen.getByRole('radio', { name: '1×' }).focus();

    await user.keyboard('{End}');

    expect(onChange).toHaveBeenCalledWith(4);
  });
});
