import { describe, expect, it } from 'vitest';

import { languageDisplayLabel } from '@/adapters/primary/shared/languageLabels';

describe('languageDisplayLabel', () => {
  it('should_return_the_identifier_unchanged_when_no_curated_label_exists', () => {
    expect(languageDisplayLabel('cobol')).toBe('cobol');
  });

  it('should_return_a_curated_human_readable_label_when_the_language_is_known', () => {
    expect(languageDisplayLabel('csharp')).toBe('C#');
  });
});
