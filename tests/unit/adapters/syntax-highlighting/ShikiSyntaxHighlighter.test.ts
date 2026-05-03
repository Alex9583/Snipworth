import { describe, it, expect } from 'vitest';

import { ShikiSyntaxHighlighter } from '@/adapters/secondary/syntax-highlighting/ShikiSyntaxHighlighter';

describe('ShikiSyntaxHighlighter', () => {
  it('should_return_a_hast_root_when_code_is_a_core_language', async () => {
    const highlighter = new ShikiSyntaxHighlighter();

    const result = await highlighter.highlight(
      'const answer: number = 42;',
      'typescript',
      'github-dark',
    );

    expect(result.hast.type).toBe('root');
    expect(result.resolvedLanguage).toBe('typescript');
    expect(result.resolvedTheme).toBe('github-dark');
    expect(JSON.stringify(result.hast)).toContain('const');
  });

  it('should_resolve_to_text_when_language_is_not_bundled', async () => {
    const highlighter = new ShikiSyntaxHighlighter();

    const result = await highlighter.highlight('hello world', 'not-a-real-language', 'github-dark');

    expect(result.resolvedLanguage).toBe('text');
    expect(result.hast.type).toBe('root');
    expect(JSON.stringify(result.hast)).toContain('hello');
  });

  it('should_resolve_to_github_dark_when_theme_is_not_bundled', async () => {
    const highlighter = new ShikiSyntaxHighlighter();

    const result = await highlighter.highlight('const x = 1;', 'typescript', 'not-a-real-theme');

    expect(result.resolvedTheme).toBe('github-dark');
  });

  it('should_highlight_a_non_core_language_when_user_selects_one', async () => {
    const highlighter = new ShikiSyntaxHighlighter();

    const result = await highlighter.highlight(
      'fn main() { println!("hi"); }',
      'rust',
      'github-dark',
    );

    expect(result.resolvedLanguage).toBe('rust');
    expect(result.hast.type).toBe('root');
    expect(JSON.stringify(result.hast)).toContain('main');
  });

  it('should_return_a_hast_root_when_code_is_empty', async () => {
    const highlighter = new ShikiSyntaxHighlighter();

    const result = await highlighter.highlight('', 'typescript', 'github-dark');

    expect(result.hast.type).toBe('root');
  });
});
