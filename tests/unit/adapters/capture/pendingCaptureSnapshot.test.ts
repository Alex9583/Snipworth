import { describe, it, expect } from 'vitest';
import { parsePendingCaptureSnapshot } from '@/adapters/secondary/capture/pendingCaptureSnapshot';

describe('parsePendingCaptureSnapshot', () => {
  it('should_return_a_snapshot_when_value_has_a_string_code_and_string_source_url', () => {
    const result = parsePendingCaptureSnapshot({
      code: 'const x = 1;',
      sourceUrl: 'https://example.com/page',
    });

    expect(result).toEqual({ code: 'const x = 1;', sourceUrl: 'https://example.com/page' });
  });

  it('should_return_a_snapshot_when_source_url_is_null', () => {
    const result = parsePendingCaptureSnapshot({ code: 'a', sourceUrl: null });

    expect(result).toEqual({ code: 'a', sourceUrl: null });
  });

  it('should_return_undefined_when_value_is_null', () => {
    expect(parsePendingCaptureSnapshot(null)).toBeUndefined();
  });

  it('should_return_undefined_when_value_is_not_an_object', () => {
    expect(parsePendingCaptureSnapshot('a string')).toBeUndefined();
  });

  it('should_return_undefined_when_code_is_not_a_string', () => {
    expect(parsePendingCaptureSnapshot({ code: 42, sourceUrl: null })).toBeUndefined();
  });

  it('should_return_undefined_when_source_url_is_neither_string_nor_null', () => {
    expect(parsePendingCaptureSnapshot({ code: 'a', sourceUrl: 42 })).toBeUndefined();
  });
});
