import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Slider } from '@/adapters/primary/app/ui/Slider';

describe('Slider', () => {
  it('should_render_a_slider_role_with_the_provided_label', () => {
    render(<Slider value={50} min={0} max={100} onChange={vi.fn()} label="Volume" />);
    expect(screen.getByRole('slider', { name: 'Volume' })).toBeInTheDocument();
  });

  it('should_reflect_the_current_value_on_the_underlying_input', () => {
    render(<Slider value={42} min={0} max={100} onChange={vi.fn()} label="Volume" />);
    expect(screen.getByRole('slider', { name: 'Volume' })).toHaveValue('42');
  });

  it('should_call_onChange_with_a_number_when_the_user_changes_the_value', () => {
    const onChange = vi.fn();
    render(<Slider value={50} min={0} max={100} onChange={onChange} label="Volume" />);
    fireEvent.change(screen.getByRole('slider', { name: 'Volume' }), { target: { value: '75' } });
    expect(onChange).toHaveBeenCalledWith(75);
    expect(typeof onChange.mock.calls[0]?.[0]).toBe('number');
  });
});
