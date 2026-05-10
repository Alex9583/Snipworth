export const APP = {
  previewLoading: 'Preparing preview…',
  preferencesLoadFailedMessage: 'Snipworth could not load saved preferences.',
} as const;

export function appBootLabel(mode: string): string {
  return `App boot OK in ${mode} mode.`;
}
