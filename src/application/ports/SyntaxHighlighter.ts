import type { HighlightedCode } from '@/domain/syntax-highlighting/HighlightedCode';

export interface SyntaxHighlighter {
  highlight(code: string, language: string, theme: string): Promise<HighlightedCode>;
}
