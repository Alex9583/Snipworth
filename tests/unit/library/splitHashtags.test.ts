import { describe, expect, it } from 'vitest';

import { splitHashtags } from '@/adapters/primary/library/splitHashtags';

describe('splitHashtags', () => {
  it('should_return_empty_array_when_input_is_empty', () => {
    expect(splitHashtags('')).toEqual([]);
  });

  it('should_return_empty_array_when_input_is_whitespace_only', () => {
    expect(splitHashtags('   ')).toEqual([]);
  });

  it('should_split_on_a_single_space_when_input_has_two_tokens', () => {
    expect(splitHashtags('#typescript #react')).toEqual(['#typescript', '#react']);
  });

  it('should_split_on_tabs_and_mixed_whitespace_when_input_uses_them_as_separators', () => {
    expect(splitHashtags('#a\t#b')).toEqual(['#a', '#b']);
  });

  it('should_collapse_consecutive_whitespace_and_strip_edges_when_input_has_extra_padding', () => {
    expect(splitHashtags('  #a   #b  ')).toEqual(['#a', '#b']);
  });

  it('should_preserve_a_lone_hash_token_without_normalizing_when_input_is_just_hash', () => {
    expect(splitHashtags('#')).toEqual(['#']);
  });

  it('should_preserve_tokens_without_a_hash_prefix_when_user_omits_it', () => {
    expect(splitHashtags('typescript react')).toEqual(['typescript', 'react']);
  });
});
