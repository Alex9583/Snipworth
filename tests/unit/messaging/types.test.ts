import { describe, it, expect } from 'vitest';
import {
  extensionMessageSchema,
  extensionResponseSchema,
  responseSchemaFor,
} from '@/adapters/messaging';

describe('extensionMessageSchema — PING', () => {
  it('should_accept_a_bare_PING_envelope', () => {
    expect(extensionMessageSchema.safeParse({ type: 'PING' }).success).toBe(true);
  });

  it('should_reject_PING_when_extra_fields_are_present', () => {
    expect(extensionMessageSchema.safeParse({ type: 'PING', extra: 1 }).success).toBe(false);
  });
});

describe('extensionMessageSchema — LOAD_CODE', () => {
  it('should_accept_LOAD_CODE_when_only_code_is_provided', () => {
    expect(
      extensionMessageSchema.safeParse({ type: 'LOAD_CODE', code: 'const x = 1;' }).success,
    ).toBe(true);
  });

  it('should_accept_LOAD_CODE_with_all_optional_fields', () => {
    expect(
      extensionMessageSchema.safeParse({
        type: 'LOAD_CODE',
        code: 'x',
        sourceUrl: 'https://example.com',
        language: 'typescript',
      }).success,
    ).toBe(true);
  });

  it('should_reject_LOAD_CODE_when_code_is_missing', () => {
    expect(extensionMessageSchema.safeParse({ type: 'LOAD_CODE' }).success).toBe(false);
  });

  it('should_reject_LOAD_CODE_when_code_is_not_a_string', () => {
    expect(extensionMessageSchema.safeParse({ type: 'LOAD_CODE', code: 42 }).success).toBe(false);
  });

  it('should_reject_LOAD_CODE_when_sourceUrl_is_not_a_string', () => {
    expect(
      extensionMessageSchema.safeParse({ type: 'LOAD_CODE', code: 'x', sourceUrl: 42 }).success,
    ).toBe(false);
  });

  it('should_reject_LOAD_CODE_when_language_is_null', () => {
    expect(
      extensionMessageSchema.safeParse({ type: 'LOAD_CODE', code: 'x', language: null }).success,
    ).toBe(false);
  });

  it('should_reject_LOAD_CODE_when_extra_fields_are_present', () => {
    expect(
      extensionMessageSchema.safeParse({ type: 'LOAD_CODE', code: 'x', extra: 1 }).success,
    ).toBe(false);
  });

  it('should_accept_LOAD_CODE_when_code_sits_at_the_1MB_boundary', () => {
    const code = 'a'.repeat(1_000_000);
    expect(extensionMessageSchema.safeParse({ type: 'LOAD_CODE', code }).success).toBe(true);
  });

  it('should_reject_LOAD_CODE_when_code_exceeds_1MB', () => {
    const code = 'a'.repeat(1_000_001);
    expect(extensionMessageSchema.safeParse({ type: 'LOAD_CODE', code }).success).toBe(false);
  });

  it('should_reject_LOAD_CODE_when_sourceUrl_exceeds_2KB', () => {
    const sourceUrl = 'https://example.com/' + 'a'.repeat(2048);
    expect(
      extensionMessageSchema.safeParse({ type: 'LOAD_CODE', code: 'x', sourceUrl }).success,
    ).toBe(false);
  });

  it('should_reject_LOAD_CODE_when_language_exceeds_64_characters', () => {
    const language = 'a'.repeat(65);
    expect(
      extensionMessageSchema.safeParse({ type: 'LOAD_CODE', code: 'x', language }).success,
    ).toBe(false);
  });

  it.each([
    ['https://example.com'],
    ['http://example.org/path?q=1'],
    ['chrome://extensions'],
    ['about:blank'],
    ['file:///tmp/snippet.ts'],
    ['view-source:https://example.net'],
    ['data:text/plain,hello'],
  ])('should_accept_LOAD_CODE_when_sourceUrl_is_a_legitimate_origin_(%s)', (sourceUrl) => {
    expect(
      extensionMessageSchema.safeParse({ type: 'LOAD_CODE', code: 'x', sourceUrl }).success,
    ).toBe(true);
  });

  it.each([['not-a-url'], [''], ['just text with spaces'], ['://no-scheme']])(
    'should_reject_LOAD_CODE_when_sourceUrl_is_malformed_(%s)',
    (sourceUrl) => {
      expect(
        extensionMessageSchema.safeParse({ type: 'LOAD_CODE', code: 'x', sourceUrl }).success,
      ).toBe(false);
    },
  );
});

describe('extensionMessageSchema — ACK_ERRORS', () => {
  it('should_accept_ACK_ERRORS_with_an_empty_acknowledgedIds_array', () => {
    expect(
      extensionMessageSchema.safeParse({ type: 'ACK_ERRORS', acknowledgedIds: [] }).success,
    ).toBe(true);
  });

  it('should_accept_ACK_ERRORS_with_a_list_of_acknowledged_ids', () => {
    expect(
      extensionMessageSchema.safeParse({
        type: 'ACK_ERRORS',
        acknowledgedIds: ['id-1', 'id-2'],
      }).success,
    ).toBe(true);
  });

  it('should_reject_ACK_ERRORS_when_acknowledgedIds_is_not_an_array', () => {
    expect(
      extensionMessageSchema.safeParse({ type: 'ACK_ERRORS', acknowledgedIds: 'not-an-array' })
        .success,
    ).toBe(false);
  });

  it('should_reject_ACK_ERRORS_when_an_id_is_empty', () => {
    expect(
      extensionMessageSchema.safeParse({ type: 'ACK_ERRORS', acknowledgedIds: [''] }).success,
    ).toBe(false);
  });

  it('should_reject_ACK_ERRORS_when_extra_fields_are_present', () => {
    expect(
      extensionMessageSchema.safeParse({
        type: 'ACK_ERRORS',
        acknowledgedIds: [],
        extra: 1,
      }).success,
    ).toBe(false);
  });

  it('should_reject_ACK_ERRORS_when_more_than_1000_ids_are_acknowledged', () => {
    const acknowledgedIds = Array.from({ length: 1001 }, (_, i) => `id-${String(i)}`);
    expect(extensionMessageSchema.safeParse({ type: 'ACK_ERRORS', acknowledgedIds }).success).toBe(
      false,
    );
  });
});

describe('extensionMessageSchema — invalid envelopes', () => {
  it.each([
    ['null', null],
    ['undefined', undefined],
    ['string', 'PING'],
    ['number', 42],
    ['boolean', true],
    ['array', ['PING']],
    ['empty object', {}],
    ['unknown type', { type: 'UNKNOWN' }],
    ['no type field', { code: 'x' }],
  ])('should_reject_envelope_when_input_is_%s', (_, input) => {
    expect(extensionMessageSchema.safeParse(input).success).toBe(false);
  });

  it('should_reject_envelope_when_type_only_lives_on_the_prototype_chain', () => {
    const obj = Object.create({ type: 'PING' }) as object;
    expect(extensionMessageSchema.safeParse(obj).success).toBe(false);
  });

  it('should_reject_envelope_when_code_is_own_but_type_is_inherited', () => {
    const obj = Object.create({ type: 'LOAD_CODE' }) as { code?: string };
    obj.code = 'x';
    expect(extensionMessageSchema.safeParse(obj).success).toBe(false);
  });

  it.each([
    ['Date', new Date()],
    ['Map', new Map()],
    ['Error', new Error('boom')],
    ['RegExp', /x/],
  ])('should_reject_envelope_when_input_is_a_%s_instance', (_, input) => {
    expect(extensionMessageSchema.safeParse(input).success).toBe(false);
  });

  it('should_emit_zod_issues_with_the_offending_path_when_LOAD_CODE_is_malformed', () => {
    const result = extensionMessageSchema.safeParse({ type: 'LOAD_CODE', code: 42 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('code'))).toBe(true);
    }
  });
});

describe('extensionResponseSchema', () => {
  it('should_accept_a_success_response_with_data', () => {
    expect(extensionResponseSchema.safeParse({ ok: true, data: 'pong' }).success).toBe(true);
  });

  it('should_accept_a_success_response_without_data', () => {
    expect(extensionResponseSchema.safeParse({ ok: true }).success).toBe(true);
  });

  it('should_accept_an_error_response', () => {
    expect(extensionResponseSchema.safeParse({ ok: false, error: 'boom' }).success).toBe(true);
  });

  it('should_reject_a_response_when_ok_true_carries_an_error_field', () => {
    expect(extensionResponseSchema.safeParse({ ok: true, error: 'x' }).success).toBe(false);
  });

  it('should_reject_a_response_when_ok_false_lacks_an_error_field', () => {
    expect(extensionResponseSchema.safeParse({ ok: false }).success).toBe(false);
  });

  it('should_reject_a_response_when_error_is_not_a_string', () => {
    expect(extensionResponseSchema.safeParse({ ok: false, error: 42 }).success).toBe(false);
  });
});

describe('responseSchemaFor — PING', () => {
  it('should_accept_a_pong_data_response', () => {
    expect(responseSchemaFor.PING.safeParse({ ok: true, data: 'pong' }).success).toBe(true);
  });

  it('should_reject_a_data_response_when_value_is_not_the_literal_pong', () => {
    expect(responseSchemaFor.PING.safeParse({ ok: true, data: 'ping' }).success).toBe(false);
  });

  it('should_reject_a_response_when_data_is_missing', () => {
    expect(responseSchemaFor.PING.safeParse({ ok: true }).success).toBe(false);
  });

  it('should_accept_an_error_response', () => {
    expect(responseSchemaFor.PING.safeParse({ ok: false, error: 'nope' }).success).toBe(true);
  });
});

describe.each(['LOAD_CODE', 'ACK_ERRORS'] as const)(
  'responseSchemaFor — %s (ack envelope)',
  (key) => {
    it('should_accept_an_ack_response_without_data', () => {
      expect(responseSchemaFor[key].safeParse({ ok: true }).success).toBe(true);
    });

    it('should_reject_an_ack_response_when_data_is_present', () => {
      expect(responseSchemaFor[key].safeParse({ ok: true, data: 'x' }).success).toBe(false);
    });

    it('should_accept_an_error_response', () => {
      expect(responseSchemaFor[key].safeParse({ ok: false, error: 'nope' }).success).toBe(true);
    });
  },
);
