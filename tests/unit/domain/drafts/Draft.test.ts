import { describe, it, expect } from 'vitest';
import {
  Draft,
  draftStatuses,
  InvalidDraft,
  type DraftCreateInput,
  type DraftSnapshot,
} from '@/domain/drafts/Draft';
import type { DraftId } from '@/domain/drafts/DraftId';
import type { Platform } from '@/domain/drafts/Platform';
import { CAPTION_MAX, HASHTAG_LIST_MAX, HASHTAG_MAX_LENGTH } from '@/domain/limits';
import { RenderConfig, type RenderConfigInput } from '@/domain/rendering/RenderConfig';

const CREATED_AT = new Date('2026-03-15T10:00:00.000Z');
const LATER = new Date('2026-03-15T10:30:00.000Z');
const EARLIER = new Date('2026-03-15T09:30:00.000Z');

const baseConfig: RenderConfigInput = {
  theme: 'github-dark',
  fontFamily: 'JetBrains Mono',
  fontSize: 14,
  lineHeight: 1.5,
  borderRadius: 8,
  background: { type: 'solid', color: '#1e1e1e' },
  showWindowControls: true,
  windowStyle: 'mac',
  showLineNumbers: false,
  firstLineNumber: 1,
  highlightLines: [],
  shadow: true,
  shadowBlur: 10,
  shadowOffsetY: 4,
  aspectRatio: 'auto',
  exportScale: 2,
  exportFormat: 'png',
};

function buildInput(overrides: Partial<DraftCreateInput> = {}): DraftCreateInput {
  return {
    id: 'draft-1' as DraftId,
    title: 'Hello world',
    code: 'const x = 1;',
    language: 'typescript',
    config: RenderConfig.from(baseConfig),
    caption: 'Look at this',
    hashtags: ['typescript'],
    platform: 'x',
    thumbnail: null,
    tags: ['demo'],
    createdAt: CREATED_AT,
    ...overrides,
  };
}

function aDraftWithNoHashtags(): Draft {
  return Draft.create(buildInput({ hashtags: [] }));
}

describe('Draft.create — happy path', () => {
  it('should_carry_every_input_field_into_the_aggregate', () => {
    const draft = Draft.create(buildInput());
    expect(draft.id).toBe('draft-1');
    expect(draft.title).toBe('Hello world');
    expect(draft.code).toBe('const x = 1;');
    expect(draft.language).toBe('typescript');
    expect(draft.caption).toBe('Look at this');
    expect(draft.hashtags).toEqual(['typescript']);
    expect(draft.platform).toBe('x');
    expect(draft.thumbnail).toBeNull();
    expect(draft.tags).toEqual(['demo']);
  });

  it('should_set_status_to_draft_on_creation', () => {
    const draft = Draft.create(buildInput());
    expect(draft.status).toBe('draft');
  });

  it('should_align_updatedAt_with_createdAt_on_creation', () => {
    const draft = Draft.create(buildInput());
    expect(draft.updatedAt.toISOString()).toBe(CREATED_AT.toISOString());
    expect(draft.createdAt.toISOString()).toBe(CREATED_AT.toISOString());
  });

  it('should_isolate_createdAt_from_caller_mutation_after_construction', () => {
    const mutable = new Date(CREATED_AT);
    const draft = Draft.create(buildInput({ createdAt: mutable }));
    mutable.setFullYear(1999);
    expect(draft.createdAt.getFullYear()).toBe(2026);
  });

  it('should_isolate_hashtags_and_tags_from_caller_mutation_after_construction', () => {
    const tags = ['demo'];
    const hashtags = ['typescript'];
    const draft = Draft.create(buildInput({ tags, hashtags }));
    tags.push('mutation');
    hashtags.push('mutation');
    expect(draft.tags).toEqual(['demo']);
    expect(draft.hashtags).toEqual(['typescript']);
  });

  it('should_accept_an_empty_title_an_empty_code_and_no_thumbnail', () => {
    const draft = Draft.create(buildInput({ title: '', code: '', thumbnail: null }));
    expect(draft.title).toBe('');
    expect(draft.code).toBe('');
    expect(draft.thumbnail).toBeNull();
  });

  it('should_accept_a_thumbnail_as_a_blob', () => {
    const blob = new Blob(['png-bytes'], { type: 'image/png' });
    const draft = Draft.create(buildInput({ thumbnail: blob }));
    expect(draft.thumbnail).toBe(blob);
  });
});

describe('Draft.create — invariants', () => {
  it('should_reject_an_empty_id', () => {
    expect(() => Draft.create(buildInput({ id: '' as DraftId }))).toThrow(InvalidDraft);
    expect(() => Draft.create(buildInput({ id: '   ' as DraftId }))).toThrow(/id/);
  });

  it('should_reject_an_empty_language', () => {
    expect(() => Draft.create(buildInput({ language: '' }))).toThrow(/language/);
    expect(() => Draft.create(buildInput({ language: '   ' }))).toThrow(/language/);
  });

  it('should_reject_an_unknown_platform', () => {
    expect(() => Draft.create(buildInput({ platform: 'mastodon' as never }))).toThrow(/platform/);
  });

  it('should_reject_a_non_finite_createdAt', () => {
    expect(() => Draft.create(buildInput({ createdAt: new Date(Number.NaN) }))).toThrow(
      /createdAt/,
    );
  });

  it('should_reject_a_title_exceeding_200_characters', () => {
    expect(() => Draft.create(buildInput({ title: 'x'.repeat(201) }))).toThrow(/title/);
  });

  it('should_reject_a_caption_exceeding_5000_characters', () => {
    expect(() => Draft.create(buildInput({ caption: 'x'.repeat(5001) }))).toThrow(/caption/);
  });

  it('should_reject_a_code_exceeding_200_000_characters', () => {
    expect(() => Draft.create(buildInput({ code: 'x'.repeat(200_001) }))).toThrow(/code/);
  });

  it('should_reject_more_than_50_tags_or_50_hashtags', () => {
    const many = Array.from({ length: 51 }, (_, i) => `tag${String(i)}`);
    expect(() => Draft.create(buildInput({ tags: many }))).toThrow(/tags/);
    expect(() => Draft.create(buildInput({ hashtags: many }))).toThrow(/hashtags/);
  });

  it('should_reject_empty_or_whitespace_tags_and_hashtags', () => {
    expect(() => Draft.create(buildInput({ tags: ['ok', ''] }))).toThrow(/tags/);
    expect(() => Draft.create(buildInput({ hashtags: ['ok', '   '] }))).toThrow(/hashtags/);
  });

  it('should_reject_duplicate_tags_or_hashtags', () => {
    expect(() => Draft.create(buildInput({ tags: ['demo', 'demo'] }))).toThrow(/tags/);
    expect(() => Draft.create(buildInput({ hashtags: ['typescript', 'typescript'] }))).toThrow(
      /hashtags/,
    );
  });
});

describe('Draft.fromSnapshot / toSnapshot', () => {
  function buildSnapshot(): DraftSnapshot {
    return Draft.create(buildInput()).toSnapshot();
  }

  it('should_render_dates_as_epoch_milliseconds_in_the_snapshot', () => {
    const snapshot = buildSnapshot();
    expect(snapshot.createdAt).toBe(CREATED_AT.getTime());
    expect(snapshot.updatedAt).toBe(CREATED_AT.getTime());
  });

  it('should_render_the_render_config_as_a_plain_snapshot', () => {
    const snapshot = buildSnapshot();
    expect(snapshot.config).toEqual(RenderConfig.from(baseConfig).toSnapshot());
  });

  it('should_round_trip_a_snapshot_back_to_an_equivalent_draft', () => {
    const original = Draft.create(buildInput());
    const round = Draft.fromSnapshot(original.toSnapshot());
    expect(round.toSnapshot()).toEqual(original.toSnapshot());
  });

  it('should_let_fromSnapshot_carry_a_persisted_updatedAt_distinct_from_createdAt', () => {
    const snapshot: DraftSnapshot = {
      ...buildSnapshot(),
      updatedAt: LATER.getTime(),
    };
    const draft = Draft.fromSnapshot(snapshot);
    expect(draft.createdAt.getTime()).toBe(CREATED_AT.getTime());
    expect(draft.updatedAt.getTime()).toBe(LATER.getTime());
  });

  it('should_expose_every_status_value_from_the_closed_enum', () => {
    expect(draftStatuses).toEqual(['draft', 'archived']);
  });
});

describe('Draft.rename', () => {
  it('should_return_a_new_draft_with_the_updated_title_and_updatedAt', () => {
    const original = Draft.create(buildInput({ title: 'Old' }));
    const renamed = original.rename('New', LATER);
    expect(renamed.title).toBe('New');
    expect(renamed.updatedAt.getTime()).toBe(LATER.getTime());
    expect(renamed.id).toBe(original.id);
  });

  it('should_not_mutate_the_original_draft', () => {
    const original = Draft.create(buildInput({ title: 'Old' }));
    original.rename('New', LATER);
    expect(original.title).toBe('Old');
    expect(original.updatedAt.getTime()).toBe(CREATED_AT.getTime());
  });

  it('should_reject_a_rename_with_a_now_earlier_than_createdAt', () => {
    const original = Draft.create(buildInput());
    expect(() => original.rename('New', EARLIER)).toThrow(InvalidDraft);
  });

  it('should_reject_a_title_exceeding_200_characters', () => {
    const original = Draft.create(buildInput());
    expect(() => original.rename('x'.repeat(201), LATER)).toThrow(/title/);
  });
});

describe('Draft.updateCode', () => {
  it('should_return_a_new_draft_with_the_updated_code_language_and_updatedAt', () => {
    const original = Draft.create(buildInput());
    const updated = original.updateCode('print("hi")', 'python', LATER);
    expect(updated.code).toBe('print("hi")');
    expect(updated.language).toBe('python');
    expect(updated.updatedAt.getTime()).toBe(LATER.getTime());
  });

  it('should_reject_an_empty_language', () => {
    const original = Draft.create(buildInput());
    expect(() => original.updateCode('code', '', LATER)).toThrow(/language/);
  });
});

describe('Draft.replaceConfig', () => {
  it('should_return_a_new_draft_with_the_updated_config_and_updatedAt', () => {
    const original = Draft.create(buildInput());
    const newConfig = RenderConfig.from({ ...baseConfig, fontSize: 18 });
    const updated = original.replaceConfig(newConfig, LATER);
    expect(updated.config.fontSize).toBe(18);
    expect(updated.updatedAt.getTime()).toBe(LATER.getTime());
  });
});

describe('Draft.switchPlatform', () => {
  it('should_set_platform_to_instagram_and_apply_the_1_1_aspect_ratio_preset_when_switchPlatform_is_called_with_instagram', () => {
    const original = Draft.create(
      buildInput({
        platform: 'x',
        config: RenderConfig.from({ ...baseConfig, aspectRatio: '16:9' }),
      }),
    );
    const switched = original.switchPlatform('instagram', LATER);
    expect(switched.platform).toBe('instagram');
    expect(switched.config.aspectRatio).toBe('1:1');
    expect(switched.updatedAt.getTime()).toBe(LATER.getTime());
    expect(original.platform).toBe('x');
    expect(original.config.aspectRatio).toBe('16:9');
  });

  it('should_set_platform_to_instagram_story_and_apply_the_9_16_aspect_ratio_preset_when_switchPlatform_is_called_with_instagram_story', () => {
    const original = Draft.create(
      buildInput({
        platform: 'linkedin',
        config: RenderConfig.from({ ...baseConfig, aspectRatio: '16:9' }),
      }),
    );
    const switched = original.switchPlatform('instagram-story', LATER);
    expect(switched.platform).toBe('instagram-story');
    expect(switched.config.aspectRatio).toBe('9:16');
  });

  it('should_set_platform_to_generic_and_apply_the_auto_aspect_ratio_preset_when_switchPlatform_is_called_with_generic', () => {
    const original = Draft.create(
      buildInput({
        platform: 'instagram',
        config: RenderConfig.from({ ...baseConfig, aspectRatio: '1:1' }),
      }),
    );
    const switched = original.switchPlatform('generic', LATER);
    expect(switched.platform).toBe('generic');
    expect(switched.config.aspectRatio).toBe('auto');
  });

  it('should_overwrite_a_manual_aspect_ratio_override_when_switchPlatform_re_applies_the_same_platform', () => {
    const overrideAt = new Date('2026-03-15T10:15:00.000Z');
    const overridden = Draft.create(
      buildInput({
        platform: 'instagram',
        config: RenderConfig.from({ ...baseConfig, aspectRatio: '1:1' }),
      }),
    ).replaceConfig(RenderConfig.from({ ...baseConfig, aspectRatio: '4:5' }), overrideAt);
    expect(overridden.config.aspectRatio).toBe('4:5');

    const switched = overridden.switchPlatform('instagram', LATER);
    expect(switched.platform).toBe('instagram');
    expect(switched.config.aspectRatio).toBe('1:1');
  });

  it('should_throw_InvalidDraft_when_switchPlatform_is_called_with_an_unknown_platform_string', () => {
    const original = Draft.create(buildInput());
    expect(() => original.switchPlatform('tiktok' as Platform, LATER)).toThrow(InvalidDraft);
    expect(() => original.switchPlatform('tiktok' as Platform, LATER)).toThrow(
      /^InvalidDraft: platform /,
    );
  });
});

describe('Draft.archive', () => {
  it('should_return_a_new_draft_with_status_archived_and_updatedAt_set_to_now_when_archive_is_called_on_an_active_draft', () => {
    const original = Draft.create(buildInput());
    const archived = original.archive(LATER);
    expect(archived.status).toBe('archived');
    expect(archived.updatedAt.getTime()).toBe(LATER.getTime());
    expect(original.status).toBe('draft');
    expect(original.updatedAt.getTime()).toBe(CREATED_AT.getTime());
  });

  it('should_return_a_new_draft_with_status_archived_and_updatedAt_set_to_now_when_archive_is_called_on_an_already_archived_draft', () => {
    const firstArchive = new Date('2026-03-15T10:15:00.000Z');
    const alreadyArchived = Draft.create(buildInput()).archive(firstArchive);
    const reArchived = alreadyArchived.archive(LATER);
    expect(reArchived.status).toBe('archived');
    expect(reArchived.updatedAt.getTime()).toBe(LATER.getTime());
  });

  it('should_throw_InvalidDraft_when_archive_is_called_with_now_earlier_than_createdAt', () => {
    const original = Draft.create(buildInput());
    expect(() => original.archive(EARLIER)).toThrow(InvalidDraft);
    expect(() => original.archive(EARLIER)).toThrow(/updatedAt must not precede createdAt/);
  });
});

describe('Draft.updateCaption', () => {
  it('should_return_a_new_draft_with_the_updated_caption_and_updatedAt_when_updateCaption_is_called_with_a_non_empty_string', () => {
    const original = Draft.create(buildInput({ caption: 'Old caption' }));
    const updated = original.updateCaption('New caption text', LATER);
    expect(updated.caption).toBe('New caption text');
    expect(updated.updatedAt.getTime()).toBe(LATER.getTime());
    expect(original.caption).toBe('Old caption');
    expect(original.updatedAt.getTime()).toBe(CREATED_AT.getTime());
  });

  it('should_accept_an_empty_caption_when_updateCaption_is_called_with_empty_string', () => {
    const original = Draft.create(buildInput({ caption: 'Some caption' }));
    const updated = original.updateCaption('', LATER);
    expect(updated.caption).toBe('');
    expect(updated.updatedAt.getTime()).toBe(LATER.getTime());
  });

  it('should_accept_a_caption_of_exactly_CAPTION_MAX_characters_when_updateCaption_is_called', () => {
    const original = Draft.create(buildInput());
    const boundary = 'a'.repeat(CAPTION_MAX);
    const updated = original.updateCaption(boundary, LATER);
    expect(updated.caption).toBe(boundary);
    expect(updated.caption.length).toBe(CAPTION_MAX);
  });

  it('should_throw_InvalidDraft_referencing_the_caption_field_when_updateCaption_exceeds_CAPTION_MAX_characters', () => {
    const original = Draft.create(buildInput());
    const overflow = 'a'.repeat(CAPTION_MAX + 1);
    expect(() => original.updateCaption(overflow, LATER)).toThrow(InvalidDraft);
    expect(() => original.updateCaption(overflow, LATER)).toThrow(/^InvalidDraft: caption /);
  });

  it('should_bump_updatedAt_when_updateCaption_is_called_with_a_caption_equal_to_the_current_one', () => {
    const original = Draft.create(buildInput({ caption: 'Hello world' }));
    const updated = original.updateCaption('Hello world', LATER);
    expect(updated.caption).toBe('Hello world');
    expect(updated.updatedAt.getTime()).toBe(LATER.getTime());
    expect(original.updatedAt.getTime()).toBe(CREATED_AT.getTime());
  });
});

describe('Draft.restore', () => {
  it('should_return_a_new_draft_with_status_draft_and_updatedAt_set_to_now_when_restore_is_called_on_an_archived_draft', () => {
    const firstArchive = new Date('2026-03-15T10:15:00.000Z');
    const archived = Draft.create(buildInput()).archive(firstArchive);
    const restored = archived.restore(LATER);
    expect(restored.status).toBe('draft');
    expect(restored.updatedAt.getTime()).toBe(LATER.getTime());
    expect(archived.status).toBe('archived');
    expect(archived.updatedAt.getTime()).toBe(firstArchive.getTime());
  });

  it('should_return_a_new_draft_with_status_draft_and_updatedAt_set_to_now_when_restore_is_called_on_an_already_active_draft', () => {
    const active = Draft.create(buildInput());
    const restored = active.restore(LATER);
    expect(restored.status).toBe('draft');
    expect(restored.updatedAt.getTime()).toBe(LATER.getTime());
  });

  it('should_throw_InvalidDraft_when_restore_is_called_with_now_earlier_than_createdAt', () => {
    const firstArchive = new Date('2026-03-15T10:15:00.000Z');
    const archived = Draft.create(buildInput()).archive(firstArchive);
    expect(() => archived.restore(EARLIER)).toThrow(InvalidDraft);
    expect(() => archived.restore(EARLIER)).toThrow(/updatedAt must not precede createdAt/);
  });
});

describe('Draft.updateHashtags', () => {
  it('should_auto_prefix_each_hashtag_with_a_hash_sign_when_updateHashtags_is_called_with_unprefixed_tokens', () => {
    const original = aDraftWithNoHashtags();
    const updated = original.updateHashtags(['typescript', 'react'], LATER);
    expect(updated.hashtags).toEqual(['#typescript', '#react']);
    expect(updated.updatedAt.getTime()).toBe(LATER.getTime());
    expect(original.hashtags).toEqual([]);
    expect(original.updatedAt.getTime()).toBe(CREATED_AT.getTime());
  });

  it('should_leave_already_prefixed_hashtags_unchanged_when_updateHashtags_is_called', () => {
    const original = aDraftWithNoHashtags();
    const updated = original.updateHashtags(['#typescript', '#react'], LATER);
    expect(updated.hashtags).toEqual(['#typescript', '#react']);
  });

  it('should_clear_all_hashtags_when_updateHashtags_is_called_with_an_empty_array', () => {
    const original = Draft.create(buildInput({ hashtags: ['typescript', 'react'] }));
    const updated = original.updateHashtags([], LATER);
    expect(updated.hashtags).toEqual([]);
  });

  it('should_drop_empty_and_whitespace_only_tokens_when_updateHashtags_normalizes_the_list', () => {
    const original = aDraftWithNoHashtags();
    const updated = original.updateHashtags(['#a', '', '   ', '\t', '#b'], LATER);
    expect(updated.hashtags).toEqual(['#a', '#b']);
  });

  it('should_dedup_hashtags_case_insensitively_and_preserve_first_occurrence_casing_when_updateHashtags_is_called', () => {
    const original = aDraftWithNoHashtags();
    const updated = original.updateHashtags(['#TypeScript', '#typescript', '#TYPESCRIPT'], LATER);
    expect(updated.hashtags).toEqual(['#TypeScript']);
  });

  it('should_accept_hashtags_containing_unicode_characters_when_updateHashtags_is_called', () => {
    const original = aDraftWithNoHashtags();
    const updated = original.updateHashtags(['#café', '#江戸'], LATER);
    expect(updated.hashtags).toEqual(['#café', '#江戸']);
  });

  it('should_throw_InvalidDraft_referencing_the_hashtag_when_updateHashtags_contains_a_token_with_inner_whitespace', () => {
    const original = aDraftWithNoHashtags();
    expect(() => original.updateHashtags(['#hello world'], LATER)).toThrow(InvalidDraft);
    expect(() => original.updateHashtags(['#hello world'], LATER)).toThrow(/hello world/);
  });

  it('should_throw_InvalidDraft_when_updateHashtags_contains_a_bare_hash_with_no_body', () => {
    const original = aDraftWithNoHashtags();
    expect(() => original.updateHashtags(['#'], LATER)).toThrow(InvalidDraft);
    expect(() => original.updateHashtags(['#'], LATER)).toThrow(/hashtags/);
  });

  it('should_throw_InvalidDraft_when_updateHashtags_contains_a_hashtag_longer_than_HASHTAG_MAX_LENGTH', () => {
    const original = aDraftWithNoHashtags();
    const overflow = '#' + 'a'.repeat(HASHTAG_MAX_LENGTH);
    expect(() => original.updateHashtags([overflow], LATER)).toThrow(InvalidDraft);
    expect(() => original.updateHashtags([overflow], LATER)).toThrow(/hashtags/);
  });

  it('should_accept_a_hashtag_of_exactly_HASHTAG_MAX_LENGTH_characters_when_updateHashtags_is_called', () => {
    const original = aDraftWithNoHashtags();
    const boundary = '#' + 'a'.repeat(HASHTAG_MAX_LENGTH - 1);
    const updated = original.updateHashtags([boundary], LATER);
    expect(updated.hashtags).toEqual([boundary]);
    expect(updated.hashtags[0]?.length).toBe(HASHTAG_MAX_LENGTH);
  });

  it('should_accept_exactly_HASHTAG_LIST_MAX_unique_hashtags_when_updateHashtags_is_called', () => {
    const original = aDraftWithNoHashtags();
    const tokens = Array.from({ length: HASHTAG_LIST_MAX }, (_, i) => `#tag${String(i)}`);
    const updated = original.updateHashtags(tokens, LATER);
    expect(updated.hashtags).toHaveLength(HASHTAG_LIST_MAX);
    expect(updated.hashtags).toEqual(tokens);
  });

  it('should_throw_InvalidDraft_referencing_the_hashtags_field_when_updateHashtags_exceeds_HASHTAG_LIST_MAX_unique_entries', () => {
    const original = aDraftWithNoHashtags();
    const tokens = Array.from({ length: HASHTAG_LIST_MAX + 1 }, (_, i) => `#tag${String(i)}`);
    expect(() => original.updateHashtags(tokens, LATER)).toThrow(InvalidDraft);
    expect(() => original.updateHashtags(tokens, LATER)).toThrow(/hashtags/);
  });
});
