export const SAVE_DRAFT_BUTTON = {
  scratchPrefix: 'Save draft',
  savedPrefix: 'Saved ',
  savingLabel: 'Saving…',
  errorLabel: 'Save failed — Retry',
  compactAriaLabel: 'Save draft',
} as const;

export function shortcutHint(modKey: 'mac' | 'pc'): string {
  return modKey === 'mac' ? '⌘S' : 'Ctrl+S';
}
