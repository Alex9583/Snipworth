import { describe, it, expect } from 'vitest';
import { appBootLabel } from '@/adapters/primary/app/app.strings';

describe('appBootLabel', () => {
  it('should_interpolate_the_mode_into_the_boot_message', () => {
    expect(appBootLabel('panel')).toBe('App boot OK in panel mode.');
  });
});
