import { describe, it, expect } from 'vitest';
import { APP } from '@/adapters/primary/app/app.strings';

describe('APP strings', () => {
  it('should_expose_a_preview_loading_label', () => {
    expect(APP.previewLoading).toBe('Preparing preview…');
  });

  it('should_split_the_brand_name_into_an_accent_prefix_and_a_neutral_suffix', () => {
    expect(APP.brandPrefix + APP.brandSuffix).toBe('Snipworth');
  });

  it('should_expose_an_accessible_logo_label_for_screen_readers', () => {
    expect(APP.logoLabel).toBe('Snipworth logo');
  });
});
