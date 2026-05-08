import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CodeInput } from '@/adapters/primary/app/ui/CodeInput';

describe('CodeInput', () => {
  it('should_render_a_textbox_role_with_the_provided_label', () => {
    render(<CodeInput value="" onChange={vi.fn()} label="Code" />);
    expect(screen.getByRole('textbox', { name: 'Code' })).toBeInTheDocument();
  });

  it('should_reflect_the_current_value_on_the_textarea', () => {
    render(<CodeInput value="const x = 1;" onChange={vi.fn()} label="Code" />);
    expect(screen.getByRole('textbox', { name: 'Code' })).toHaveValue('const x = 1;');
  });

  it('should_show_the_placeholder_when_one_is_provided', () => {
    render(<CodeInput value="" onChange={vi.fn()} label="Code" placeholder="Paste your snippet" />);
    expect(screen.getByPlaceholderText('Paste your snippet')).toBeInTheDocument();
  });

  it('should_call_onChange_with_the_new_string_when_the_user_changes_the_value', () => {
    const onChange = vi.fn();
    render(<CodeInput value="" onChange={onChange} label="Code" />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Code' }), {
      target: { value: 'hello' },
    });
    expect(onChange).toHaveBeenCalledWith('hello');
    expect(typeof onChange.mock.calls[0]?.[0]).toBe('string');
  });
});
