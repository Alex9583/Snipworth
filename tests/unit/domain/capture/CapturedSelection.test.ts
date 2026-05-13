import { describe, it, expect } from 'vitest';
import { CapturedSelection, InvalidCapturedSelection } from '@/domain/capture/CapturedSelection';

describe('CapturedSelection', () => {
  it('should_expose_the_provided_code_and_source_url_when_constructed_via_from', () => {
    const selection = CapturedSelection.from({
      code: 'const x = 1;',
      sourceUrl: 'https://example.com/page',
    });

    expect(selection.code).toBe('const x = 1;');
    expect(selection.sourceUrl).toBe('https://example.com/page');
  });

  it('should_preserve_an_undefined_source_url_when_constructed_without_one', () => {
    const selection = CapturedSelection.from({ code: 'a', sourceUrl: undefined });

    expect(selection.sourceUrl).toBeUndefined();
  });

  it('should_throw_invalid_captured_selection_when_code_is_empty', () => {
    expect(() => CapturedSelection.from({ code: '', sourceUrl: undefined })).toThrow(
      InvalidCapturedSelection,
    );
  });

  it('should_return_a_snapshot_carrying_code_and_source_url', () => {
    const selection = CapturedSelection.from({
      code: 'a',
      sourceUrl: 'https://example.org/x',
    });

    expect(selection.toSnapshot()).toEqual({
      code: 'a',
      sourceUrl: 'https://example.org/x',
    });
  });
});
