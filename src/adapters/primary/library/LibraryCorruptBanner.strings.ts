export const LIBRARY_CORRUPT_BANNER = {
  reportButton: 'Report',
} as const;

export function messageWithCount(count: number): string {
  return count === 1
    ? '1 draft could not be loaded'
    : `${String(count)} drafts could not be loaded`;
}
