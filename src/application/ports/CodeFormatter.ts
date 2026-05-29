export type FormatOutcome =
  | { readonly kind: 'formatted'; readonly code: string }
  | { readonly kind: 'failed'; readonly cause: unknown };

export interface CodeFormatter {
  supports(language: string): boolean;
  format(code: string, language: string): Promise<FormatOutcome>;
}
