export type OpenFullTabOutcome =
  | { readonly kind: 'opened' }
  | { readonly kind: 'open_failed'; readonly cause: unknown };

export interface FullTabOpener {
  openFullTab(): Promise<OpenFullTabOutcome>;
}
