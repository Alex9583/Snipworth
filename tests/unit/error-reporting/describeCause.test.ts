import { describe, it, expect } from 'vitest';
import { describeCause } from '@/domain/error-reporting/describeCause';

describe('describeCause', () => {
  it('should_render_an_Error_message_directly', () => {
    expect(describeCause(new Error('boom'))).toBe('boom');
  });

  it('should_pass_a_string_through_unchanged', () => {
    expect(describeCause('plain string boom')).toBe('plain string boom');
  });

  it('should_serialize_a_plain_object_via_JSON_stringify', () => {
    expect(describeCause({ code: 42, reason: 'limit' })).toBe('{"code":42,"reason":"limit"}');
  });

  it('should_surface_the_serialization_failure_when_JSON_stringify_throws_on_a_circular_reference', () => {
    interface Node {
      next?: Node;
    }
    const a: Node = {};
    a.next = a;

    const result = describeCause(a);

    expect(result).toMatch(/^\[describeCause: unserializable cause \(/);
    expect(result).toMatch(/\)]$/);
    expect(result).toMatch(/circular/i);
  });
});
