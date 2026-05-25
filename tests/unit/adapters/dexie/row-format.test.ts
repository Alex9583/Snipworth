import { describe, it, expect } from 'vitest';

import { draftRowSchema } from '@/adapters/secondary/dexie/row-format';
import { RenderConfig } from '@/domain/rendering/RenderConfig';

const CREATED_AT_MS = 1_700_000_000_000;
const UPDATED_AT_MS = 1_700_000_000_000;

function aValidV2Row() {
  return {
    id: 'draft-1',
    title: 'Hello',
    code: 'const x = 1;',
    language: 'typescript',
    config: RenderConfig.default().toSnapshot(),
    caption: '',
    hashtags: ['#typescript'],
    platform: 'x' as const,
    status: 'draft' as const,
    createdAt: CREATED_AT_MS,
    updatedAt: UPDATED_AT_MS,
  };
}

describe('draftRowSchema — v2 shape', () => {
  it('should_parse_successfully_when_a_complete_v2_row_with_all_required_fields_is_provided', () => {
    const row = aValidV2Row();

    const result = draftRowSchema.safeParse(row);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(row);
    }
  });

  it('should_fail_to_parse_with_an_unrecognized_key_issue_when_a_row_contains_an_extra_thumbnail_field', () => {
    const row = { ...aValidV2Row(), thumbnail: null };

    const result = draftRowSchema.safeParse(row);

    expect(result.success).toBe(false);
    if (!result.success) {
      const unknownKeyIssue = result.error.issues.find((i) => i.code === 'unrecognized_keys');
      expect(unknownKeyIssue).toBeDefined();
      expect(unknownKeyIssue?.keys).toContain('thumbnail');
    }
  });

  it('should_fail_to_parse_with_an_invalid_enum_issue_on_status_when_status_is_published', () => {
    const row = { ...aValidV2Row(), status: 'published' as 'draft' };

    const result = draftRowSchema.safeParse(row);

    expect(result.success).toBe(false);
    if (!result.success) {
      const statusIssue = result.error.issues.find((i) => i.path[0] === 'status');
      expect(statusIssue).toBeDefined();
    }
  });

  it('should_fail_to_parse_when_a_hashtag_does_not_start_with_a_hash_prefix', () => {
    const row = { ...aValidV2Row(), hashtags: ['typescript'] };

    const result = draftRowSchema.safeParse(row);

    expect(result.success).toBe(false);
    if (!result.success) {
      const regexIssue = result.error.issues.find(
        (i) => i.code === 'invalid_format' && i.path[0] === 'hashtags',
      );
      expect(regexIssue).toBeDefined();
    }
  });

  it('should_fail_to_parse_when_a_hashtag_contains_whitespace', () => {
    const row = { ...aValidV2Row(), hashtags: ['#hello world'] };

    const result = draftRowSchema.safeParse(row);

    expect(result.success).toBe(false);
    if (!result.success) {
      const regexIssue = result.error.issues.find(
        (i) => i.code === 'invalid_format' && i.path[0] === 'hashtags',
      );
      expect(regexIssue).toBeDefined();
    }
  });

  it('should_fail_to_parse_when_the_hashtags_array_exceeds_thirty_entries', () => {
    const tooMany = Array.from({ length: 31 }, (_, i) => `#tag${String(i)}`);
    const row = { ...aValidV2Row(), hashtags: tooMany };

    const result = draftRowSchema.safeParse(row);

    expect(result.success).toBe(false);
    if (!result.success) {
      const tooBigIssue = result.error.issues.find(
        (i) => i.code === 'too_big' && i.path.length === 1 && i.path[0] === 'hashtags',
      );
      expect(tooBigIssue).toBeDefined();
    }
  });

  it('should_fail_to_parse_when_a_hashtag_body_exceeds_the_99_character_limit', () => {
    const overflow = '#' + 'a'.repeat(100);
    const row = { ...aValidV2Row(), hashtags: [overflow] };

    const result = draftRowSchema.safeParse(row);

    expect(result.success).toBe(false);
    if (!result.success) {
      const regexIssue = result.error.issues.find(
        (i) => i.code === 'invalid_format' && i.path[0] === 'hashtags',
      );
      expect(regexIssue).toBeDefined();
    }
  });
});
