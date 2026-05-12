import { describe, it, expect } from 'vitest';
import { charsCount, linesCount } from '@/adapters/primary/app/editor-stats';

describe('linesCount', () => {
  it('should_return_one_when_code_is_empty', () => {
    expect(linesCount('')).toBe(1);
  });

  it('should_return_one_when_code_has_no_newlines', () => {
    expect(linesCount('const x = 1;')).toBe(1);
  });

  it('should_return_two_when_code_has_a_single_newline', () => {
    expect(linesCount('const x = 1;\nconst y = 2;')).toBe(2);
  });

  it('should_count_trailing_newline_as_an_additional_line', () => {
    expect(linesCount('first\n')).toBe(2);
  });

  it('should_return_n_lines_for_n_minus_one_newlines', () => {
    expect(linesCount('a\nb\nc\nd\ne')).toBe(5);
  });
});

describe('charsCount', () => {
  it('should_return_zero_when_code_is_empty', () => {
    expect(charsCount('')).toBe(0);
  });

  it('should_return_the_string_length_for_simple_ascii', () => {
    expect(charsCount('const x = 1;')).toBe(12);
  });

  it('should_count_newlines_as_characters', () => {
    expect(charsCount('a\nb')).toBe(3);
  });
});
