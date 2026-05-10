import type { Root } from 'hast';

import type { HighlightedCode, SyntaxHighlighter } from '@/application/ports/SyntaxHighlighter';

interface HighlighterCall {
  readonly code: string;
  readonly language: string;
  readonly theme: string;
}

function defaultHast(code: string): Root {
  return {
    type: 'root',
    children: [
      {
        type: 'element',
        tagName: 'pre',
        properties: {},
        children: [
          {
            type: 'element',
            tagName: 'code',
            properties: {},
            children: [{ type: 'text', value: code }],
          },
        ],
      },
    ],
  };
}

export class FakeSyntaxHighlighter implements SyntaxHighlighter {
  readonly calls: HighlighterCall[] = [];
  private nextResult: HighlightedCode | null = null;

  setNextResult(result: HighlightedCode): void {
    this.nextResult = result;
  }

  highlight(code: string, language: string, theme: string): Promise<HighlightedCode> {
    this.calls.push({ code, language, theme });
    const result =
      this.nextResult ??
      ({
        hast: defaultHast(code),
        resolvedLanguage: language,
        resolvedTheme: theme,
      } satisfies HighlightedCode);
    this.nextResult = null;
    return Promise.resolve(result);
  }
}
