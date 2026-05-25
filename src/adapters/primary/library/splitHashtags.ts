export function splitHashtags(raw: string): readonly string[] {
  return raw
    .trim()
    .split(/[\s,]+/)
    .filter((token) => token.length > 0);
}
