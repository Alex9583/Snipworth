declare const snippetIdBrand: unique symbol;
export type SnippetId = string & { readonly [snippetIdBrand]: true };
