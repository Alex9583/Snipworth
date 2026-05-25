export const CAPTION_BAR = {
  captionLabel: 'Caption',
  hashtagsLabel: 'Hashtags',
  charactersLabel: 'Characters',
} as const;

export function remainingHint(platformLabel: string, remaining: number): string {
  return `for ${platformLabel} · ${String(remaining)} remaining`;
}
