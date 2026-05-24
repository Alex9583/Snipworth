import { describe, expect, it } from 'vitest';

import { shortcutHint } from '@/adapters/primary/library/SaveDraftButton.strings';

describe('shortcutHint', () => {
  it('should_return_command_S_when_modKey_is_mac', () => {
    expect(shortcutHint('mac')).toBe('⌘S');
  });

  it('should_return_ctrl_S_when_modKey_is_pc', () => {
    expect(shortcutHint('pc')).toBe('Ctrl+S');
  });
});
