export const APP = {
  previewLoading: 'Preparing preview…',
  codePlaceholder: 'Paste or type code…',
  preferencesLoadFailedMessage: 'Snipworth could not load saved preferences.',
  preferencesSaveFailedMessage: 'Snipworth could not save your preferences.',
  brandPrefix: 'Snip',
  brandSuffix: 'worth',
  logoLabel: 'Snipworth logo',
  supportButton: 'Support',
  supportTooltip: 'Buy me a coffee',
  githubTooltip: 'Open GitHub repository',
  openFullTabTooltip: 'Open in full tab',
  openFullTabFailedMessage: 'Snipworth could not open the full-tab editor.',
} as const;

export function versionBadgeLabel(version: string): string {
  return `v${version}`;
}
