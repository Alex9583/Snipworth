import { describe, it, expect } from 'vitest';
import {
  extensionMessageSchema,
  extensionResponseSchema,
  responseSchemaFor,
} from '@/lib/messaging';

describe('extensionMessageSchema', () => {
  describe('PING', () => {
    it('accepts a bare PING envelope', () => {
      expect(extensionMessageSchema.safeParse({ type: 'PING' }).success).toBe(true);
    });

    it('rejects PING with extra fields (strict)', () => {
      expect(extensionMessageSchema.safeParse({ type: 'PING', extra: 1 }).success).toBe(false);
    });
  });

  describe('OPEN_FULL_TAB', () => {
    it('accepts a bare OPEN_FULL_TAB envelope', () => {
      expect(extensionMessageSchema.safeParse({ type: 'OPEN_FULL_TAB' }).success).toBe(true);
    });

    it('rejects OPEN_FULL_TAB with extra fields', () => {
      expect(extensionMessageSchema.safeParse({ type: 'OPEN_FULL_TAB', x: 1 }).success).toBe(false);
    });
  });

  describe('LOAD_CODE', () => {
    it('accepts with required code only', () => {
      expect(
        extensionMessageSchema.safeParse({ type: 'LOAD_CODE', code: 'const x = 1;' }).success,
      ).toBe(true);
    });

    it('accepts with all optional fields', () => {
      expect(
        extensionMessageSchema.safeParse({
          type: 'LOAD_CODE',
          code: 'x',
          sourceUrl: 'https://example.com',
          language: 'typescript',
        }).success,
      ).toBe(true);
    });

    it('rejects without code', () => {
      expect(extensionMessageSchema.safeParse({ type: 'LOAD_CODE' }).success).toBe(false);
    });

    it('rejects non-string code', () => {
      expect(extensionMessageSchema.safeParse({ type: 'LOAD_CODE', code: 42 }).success).toBe(false);
    });

    it('rejects non-string sourceUrl', () => {
      expect(
        extensionMessageSchema.safeParse({ type: 'LOAD_CODE', code: 'x', sourceUrl: 42 }).success,
      ).toBe(false);
    });

    it('rejects null language', () => {
      expect(
        extensionMessageSchema.safeParse({ type: 'LOAD_CODE', code: 'x', language: null }).success,
      ).toBe(false);
    });

    it('rejects extra fields', () => {
      expect(
        extensionMessageSchema.safeParse({ type: 'LOAD_CODE', code: 'x', extra: 1 }).success,
      ).toBe(false);
    });

    describe('size bounds', () => {
      it('accepts code at the 1MB boundary', () => {
        const code = 'a'.repeat(1_000_000);
        expect(extensionMessageSchema.safeParse({ type: 'LOAD_CODE', code }).success).toBe(true);
      });

      it('rejects code exceeding 1MB (DoS guard at the wire boundary)', () => {
        const code = 'a'.repeat(1_000_001);
        expect(extensionMessageSchema.safeParse({ type: 'LOAD_CODE', code }).success).toBe(false);
      });

      it('rejects sourceUrl exceeding 2KB', () => {
        const sourceUrl = 'https://example.com/' + 'a'.repeat(2048);
        expect(
          extensionMessageSchema.safeParse({ type: 'LOAD_CODE', code: 'x', sourceUrl }).success,
        ).toBe(false);
      });

      it('rejects language exceeding 64 characters', () => {
        const language = 'a'.repeat(65);
        expect(
          extensionMessageSchema.safeParse({ type: 'LOAD_CODE', code: 'x', language }).success,
        ).toBe(false);
      });
    });

    describe('sourceUrl validation', () => {
      it.each([
        ['https://example.com'],
        ['http://example.org/path?q=1'],
        ['chrome://extensions'],
        ['about:blank'],
        ['file:///tmp/snippet.ts'],
        ['view-source:https://example.net'],
        ['data:text/plain,hello'],
      ])('accepts %s (legitimate origin for copied code)', (sourceUrl) => {
        expect(
          extensionMessageSchema.safeParse({ type: 'LOAD_CODE', code: 'x', sourceUrl }).success,
        ).toBe(true);
      });

      it.each([['not-a-url'], [''], ['just text with spaces'], ['://no-scheme']])(
        'rejects malformed URL %s',
        (sourceUrl) => {
          expect(
            extensionMessageSchema.safeParse({ type: 'LOAD_CODE', code: 'x', sourceUrl }).success,
          ).toBe(false);
        },
      );
    });
  });

  describe('invalid envelopes', () => {
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
    ])('rejects %s', (_, input) => {
      expect(extensionMessageSchema.safeParse(input).success).toBe(false);
    });

    it('rejects an object with type only on the prototype chain', () => {
      const obj = Object.create({ type: 'PING' }) as object;
      expect(extensionMessageSchema.safeParse(obj).success).toBe(false);
    });

    it('rejects an object with own code but inherited type', () => {
      const obj = Object.create({ type: 'LOAD_CODE' }) as { code?: string };
      obj.code = 'x';
      expect(extensionMessageSchema.safeParse(obj).success).toBe(false);
    });

    it.each([
      ['Date', new Date()],
      ['Map', new Map()],
      ['Error', new Error('boom')],
      ['RegExp', /x/],
    ])('rejects %s instance (preprocess strips internal slots to {})', (_, input) => {
      expect(extensionMessageSchema.safeParse(input).success).toBe(false);
    });
  });

  describe('error reporting', () => {
    it('returns issues with paths for malformed LOAD_CODE', () => {
      const result = extensionMessageSchema.safeParse({ type: 'LOAD_CODE', code: 42 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('code'))).toBe(true);
      }
    });
  });
});

describe('extensionResponseSchema', () => {
  it('accepts a success response with data', () => {
    expect(extensionResponseSchema.safeParse({ ok: true, data: 'pong' }).success).toBe(true);
  });

  it('accepts a success response without data', () => {
    expect(extensionResponseSchema.safeParse({ ok: true }).success).toBe(true);
  });

  it('accepts an error response', () => {
    expect(extensionResponseSchema.safeParse({ ok: false, error: 'boom' }).success).toBe(true);
  });

  it('rejects mixed shape (ok: true with error)', () => {
    expect(extensionResponseSchema.safeParse({ ok: true, error: 'x' }).success).toBe(false);
  });

  it('rejects ok: false without error', () => {
    expect(extensionResponseSchema.safeParse({ ok: false }).success).toBe(false);
  });

  it('rejects non-string error', () => {
    expect(extensionResponseSchema.safeParse({ ok: false, error: 42 }).success).toBe(false);
  });
});

describe('responseSchemaFor', () => {
  describe('PING', () => {
    it('accepts {ok: true, data: "pong"}', () => {
      expect(responseSchemaFor.PING.safeParse({ ok: true, data: 'pong' }).success).toBe(true);
    });

    it('rejects {ok: true, data: "ping"} (data must be the literal "pong")', () => {
      expect(responseSchemaFor.PING.safeParse({ ok: true, data: 'ping' }).success).toBe(false);
    });

    it('rejects {ok: true} without data', () => {
      expect(responseSchemaFor.PING.safeParse({ ok: true }).success).toBe(false);
    });

    it('accepts an error response', () => {
      expect(responseSchemaFor.PING.safeParse({ ok: false, error: 'nope' }).success).toBe(true);
    });
  });

  describe.each(['OPEN_FULL_TAB', 'LOAD_CODE'] as const)('%s (ack envelope)', (key) => {
    it('accepts {ok: true} without data', () => {
      expect(responseSchemaFor[key].safeParse({ ok: true }).success).toBe(true);
    });

    it('rejects {ok: true, data: ...} (strict)', () => {
      expect(responseSchemaFor[key].safeParse({ ok: true, data: 'x' }).success).toBe(false);
    });

    it('accepts an error response', () => {
      expect(responseSchemaFor[key].safeParse({ ok: false, error: 'nope' }).success).toBe(true);
    });
  });
});
