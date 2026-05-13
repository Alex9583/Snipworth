import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { EditorStats } from '@/adapters/primary/app/ui/EditorStats';

describe('EditorStats', () => {
  it('should_render_one_line_zero_chars_when_code_is_empty', () => {
    render(<EditorStats code="" />);

    expect(screen.getByRole('status')).toHaveTextContent('1 line · 0 chars · LF · UTF-8');
  });

  it('should_render_the_lines_and_chars_for_a_single_non_empty_line', () => {
    render(<EditorStats code="const x = 1;" />);

    expect(screen.getByRole('status')).toHaveTextContent('1 line · 12 chars · LF · UTF-8');
  });

  it('should_count_newlines_to_compute_lines_and_full_length_for_chars', () => {
    render(<EditorStats code={'a\nb\nc'} />);

    expect(screen.getByRole('status')).toHaveTextContent('3 lines · 5 chars · LF · UTF-8');
  });
});
