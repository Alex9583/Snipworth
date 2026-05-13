import type { Root } from 'hast';

export interface HighlightedCode {
  readonly hast: Root;
  readonly resolvedLanguage: string;
  readonly resolvedTheme: string;
}

export interface SyntaxHighlighter {
  highlight(code: string, language: string, theme: string): Promise<HighlightedCode>;
}
