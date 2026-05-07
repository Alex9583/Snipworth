declare const draftIdBrand: unique symbol;
export type DraftId = string & { readonly [draftIdBrand]: true };
