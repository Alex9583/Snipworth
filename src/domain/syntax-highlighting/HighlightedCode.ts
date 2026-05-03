import type { Root } from 'hast';

export interface HighlightedCode {
  readonly hast: Root;
  readonly resolvedLanguage: string;
  readonly resolvedTheme: string;
}
