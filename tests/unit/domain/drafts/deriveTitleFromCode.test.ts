import { describe, it, expect } from 'vitest';
import { deriveTitleFromCode } from '@/domain/drafts/deriveTitleFromCode';

describe('deriveTitleFromCode', () => {
  it('should_return_the_line_as_is_when_code_is_a_single_clean_line', () => {
    const code = 'const greeting = "hello world";';
    expect(deriveTitleFromCode(code)).toBe('const greeting = "hello world";');
  });

  it('should_trim_leading_whitespace_when_first_line_is_indented', () => {
    const code = '    const x = 1;';
    expect(deriveTitleFromCode(code)).toBe('const x = 1;');
  });

  it('should_trim_trailing_whitespace_when_first_line_has_trailing_spaces', () => {
    const code = 'const x = 1;    ';
    expect(deriveTitleFromCode(code)).toBe('const x = 1;');
  });

  it('should_select_the_first_line_when_code_spans_multiple_lines', () => {
    const code = 'function greet() {\n  return "hi";\n}';
    expect(deriveTitleFromCode(code)).toBe('function greet() {');
  });

  it('should_skip_leading_blank_lines_until_a_non_blank_line_is_found', () => {
    const code = '\n\n   \n\tconst x = 1;';
    expect(deriveTitleFromCode(code)).toBe('const x = 1;');
  });

  it('should_not_truncate_when_line_is_shorter_than_TITLE_MAX', () => {
    const code = 'a'.repeat(199);
    const result = deriveTitleFromCode(code);
    expect(result).toBe('a'.repeat(199));
    expect(result.endsWith('…')).toBe(false);
  });

  it('should_not_truncate_when_line_is_exactly_TITLE_MAX', () => {
    const code = 'a'.repeat(200);
    const result = deriveTitleFromCode(code);
    expect(result).toBe('a'.repeat(200));
    expect(result.endsWith('…')).toBe(false);
  });

  it('should_truncate_with_ellipsis_when_line_exceeds_TITLE_MAX_by_one', () => {
    const code = 'a'.repeat(201);
    const result = deriveTitleFromCode(code);
    expect(result).toHaveLength(200);
    expect(result.startsWith('a'.repeat(197))).toBe(true);
    expect(result.endsWith('…')).toBe(true);
  });

  it('should_truncate_to_TITLE_MAX_regardless_of_overshoot_amount', () => {
    const code = 'a'.repeat(250);
    const result = deriveTitleFromCode(code);
    expect(result).toHaveLength(200);
    expect(result.startsWith('a'.repeat(197))).toBe(true);
    expect(result.endsWith('…')).toBe(true);
  });

  it('should_trim_before_measuring_length_when_line_has_surrounding_whitespace', () => {
    const code = '    ' + 'a'.repeat(250) + '    ';
    const result = deriveTitleFromCode(code);
    expect(result).toHaveLength(200);
    expect(result.startsWith('a'.repeat(197))).toBe(true);
    expect(result.endsWith('…')).toBe(true);
  });

  it('should_return_Untitled_fallback_when_code_is_empty_string', () => {
    expect(deriveTitleFromCode('')).toBe('Untitled');
  });

  it('should_return_Untitled_fallback_when_code_is_only_whitespace', () => {
    expect(deriveTitleFromCode('   \n\t  \n   ')).toBe('Untitled');
  });
});
