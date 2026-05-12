import { describe, it, expect } from 'vitest';
import { editorStatsLabel } from '@/adapters/primary/app/editor-stats.strings';

describe('editorStatsLabel', () => {
  it('should_pluralize_lines_and_chars_when_count_is_zero', () => {
    expect(editorStatsLabel(0, 0)).toBe('0 lines · 0 chars · LF · UTF-8');
  });

  it('should_use_singular_when_lines_and_chars_are_one', () => {
    expect(editorStatsLabel(1, 1)).toBe('1 line · 1 char · LF · UTF-8');
  });

  it('should_pluralize_when_lines_and_chars_are_greater_than_one', () => {
    expect(editorStatsLabel(10, 247)).toBe('10 lines · 247 chars · LF · UTF-8');
  });

  it('should_mix_singular_and_plural_independently', () => {
    expect(editorStatsLabel(1, 12)).toBe('1 line · 12 chars · LF · UTF-8');
    expect(editorStatsLabel(3, 1)).toBe('3 lines · 1 char · LF · UTF-8');
  });
});
