export const platforms = [
  'x',
  'linkedin',
  'instagram',
  'instagram-story',
  'thread',
  'generic',
] as const;

export type Platform = (typeof platforms)[number];

export function isPlatform(value: unknown): value is Platform {
  return typeof value === 'string' && (platforms as readonly string[]).includes(value);
}
