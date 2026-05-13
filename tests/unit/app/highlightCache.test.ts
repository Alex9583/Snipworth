import { describe, expect, it } from 'vitest';

import { createHighlightCache } from '@/adapters/primary/app/highlightCache';

import { FakeSyntaxHighlighter } from '../../setup/fakes/FakeSyntaxHighlighter';

describe('createHighlightCache', () => {
  it('should_return_the_same_promise_for_repeated_calls_with_the_same_inputs', async () => {
    const highlighter = new FakeSyntaxHighlighter();
    const lookup = createHighlightCache(highlighter);

    const first = lookup('const x = 1;', 'typescript', 'github-dark');
    const second = lookup('const x = 1;', 'typescript', 'github-dark');

    expect(second).toBe(first);
    await Promise.all([first, second]);
  });

  it('should_invoke_the_highlighter_only_once_for_repeated_calls_with_the_same_inputs', () => {
    const highlighter = new FakeSyntaxHighlighter();
    const lookup = createHighlightCache(highlighter);

    void lookup('print(1)', 'python', 'github-dark');
    void lookup('print(1)', 'python', 'github-dark');
    void lookup('print(1)', 'python', 'github-dark');

    expect(highlighter.calls).toHaveLength(1);
  });

  it('should_invoke_the_highlighter_again_when_the_code_changes', () => {
    const highlighter = new FakeSyntaxHighlighter();
    const lookup = createHighlightCache(highlighter);

    void lookup('a', 'typescript', 'github-dark');
    void lookup('b', 'typescript', 'github-dark');

    expect(highlighter.calls).toHaveLength(2);
  });

  it('should_invoke_the_highlighter_again_when_the_language_changes', () => {
    const highlighter = new FakeSyntaxHighlighter();
    const lookup = createHighlightCache(highlighter);

    void lookup('x', 'typescript', 'github-dark');
    void lookup('x', 'python', 'github-dark');

    expect(highlighter.calls).toHaveLength(2);
  });

  it('should_invoke_the_highlighter_again_when_the_theme_changes', () => {
    const highlighter = new FakeSyntaxHighlighter();
    const lookup = createHighlightCache(highlighter);

    void lookup('x', 'typescript', 'github-dark');
    void lookup('x', 'typescript', 'github-light');

    expect(highlighter.calls).toHaveLength(2);
  });

  it('should_distinguish_inputs_that_only_differ_by_a_separator_character_collision', () => {
    const highlighter = new FakeSyntaxHighlighter();
    const lookup = createHighlightCache(highlighter);

    // Two different (lang, theme, code) triplets that would collide under a naïve
    // string concatenation key. JSON.stringify keeps them distinct.
    void lookup('typescript', 'github-dark', 'codeA');
    void lookup('typescript', 'github-darkcodeA', '');

    expect(highlighter.calls).toHaveLength(2);
  });

  it('should_pass_the_provided_inputs_through_to_the_highlighter', async () => {
    const highlighter = new FakeSyntaxHighlighter();
    const lookup = createHighlightCache(highlighter);

    await lookup('const a = 1;', 'typescript', 'github-light');

    expect(highlighter.calls).toEqual([
      { code: 'const a = 1;', language: 'typescript', theme: 'github-light' },
    ]);
  });

  it('should_evict_the_oldest_entry_when_capacity_is_exceeded', () => {
    const highlighter = new FakeSyntaxHighlighter();
    const lookup = createHighlightCache(highlighter, { capacity: 2 });

    void lookup('a', 'typescript', 'github-dark');
    void lookup('b', 'typescript', 'github-dark');
    void lookup('c', 'typescript', 'github-dark');

    expect(highlighter.calls).toHaveLength(3);

    void lookup('a', 'typescript', 'github-dark');

    expect(highlighter.calls.filter((call) => call.code === 'a')).toHaveLength(2);
  });

  it('should_not_evict_a_recently_used_entry', () => {
    const highlighter = new FakeSyntaxHighlighter();
    const lookup = createHighlightCache(highlighter, { capacity: 2 });

    void lookup('a', 'typescript', 'github-dark');
    void lookup('b', 'typescript', 'github-dark');
    void lookup('a', 'typescript', 'github-dark');
    void lookup('c', 'typescript', 'github-dark');
    void lookup('a', 'typescript', 'github-dark');

    expect(highlighter.calls.filter((call) => call.code === 'a')).toHaveLength(1);
  });
});
