import type { CodeFormatter } from '@/application/ports/CodeFormatter';

export type FormatResult =
  | { readonly kind: 'formatted'; readonly code: string }
  | { readonly kind: 'not_formattable' }
  | { readonly kind: 'failed'; readonly cause: unknown };

export class FormatCode {
  constructor(private readonly formatter: CodeFormatter) {}

  supports(language: string): boolean {
    return this.formatter.supports(language);
  }

  async execute(code: string, language: string): Promise<FormatResult> {
    if (!this.formatter.supports(language)) {
      return { kind: 'not_formattable' };
    }
    return await this.formatter.format(code, language);
  }
}
