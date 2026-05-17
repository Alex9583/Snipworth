import { describe, it, expect } from 'vitest';
import { parseBrandedId } from '@/domain/ids/branded-id';
import { ID_MAX } from '@/domain/limits';

declare const sampleIdBrand: unique symbol;
type SampleId = string & { readonly [sampleIdBrand]: true };

class InvalidSample extends Error {
  constructor(reason: string) {
    super(`InvalidSample: ${reason}`);
    this.name = 'InvalidSample';
  }
}

const fail = (reason: string): never => {
  throw new InvalidSample(reason);
};

describe('parseBrandedId', () => {
  it('should_return_the_raw_value_branded_when_a_valid_string_is_provided', () => {
    const id = parseBrandedId<SampleId>('sample-1', fail);
    expect(id).toBe('sample-1');
  });

  it('should_call_fail_with_an_id_message_when_the_raw_is_empty', () => {
    expect(() => parseBrandedId<SampleId>('', fail)).toThrow(InvalidSample);
    expect(() => parseBrandedId<SampleId>('', fail)).toThrow(/^InvalidSample: id /);
  });

  it('should_call_fail_when_the_raw_is_whitespace_only', () => {
    expect(() => parseBrandedId<SampleId>('   ', fail)).toThrow(/^InvalidSample: id /);
  });

  it('should_call_fail_when_the_raw_exceeds_ID_MAX_characters', () => {
    const tooLong = 'x'.repeat(ID_MAX + 1);
    expect(() => parseBrandedId<SampleId>(tooLong, fail)).toThrow(InvalidSample);
    expect(() => parseBrandedId<SampleId>(tooLong, fail)).toThrow(/^InvalidSample: id /);
  });

  it('should_use_the_provided_field_name_in_the_failure_message_when_passed_as_third_argument', () => {
    expect(() => parseBrandedId<SampleId>('', fail, 'draftId')).toThrow(/^InvalidSample: draftId /);
  });
});
