import { describe, expect, it } from 'vitest';

import { FormatCode } from '@/application/use-cases/FormatCode';

import { StubCodeFormatter } from '../../../setup/fakes/StubCodeFormatter';

describe('FormatCode', () => {
  it('should_return_the_formatted_code_when_the_language_is_formattable', async () => {
    const useCase = new FormatCode(
      new StubCodeFormatter({
        supports: true,
        outcome: { kind: 'formatted', code: 'const x = 1;\n' },
      }),
    );

    const result = await useCase.execute('const  x=1', 'javascript');

    expect(result).toEqual({ kind: 'formatted', code: 'const x = 1;\n' });
  });

  it('should_return_not_formattable_without_invoking_the_formatter_when_the_language_is_unsupported', async () => {
    const formatter = new StubCodeFormatter({
      supports: false,
      outcome: { kind: 'formatted', code: 'should not be returned' },
    });
    const useCase = new FormatCode(formatter);

    const result = await useCase.execute('print("hi")', 'python');

    expect(result).toEqual({ kind: 'not_formattable' });
    expect(formatter.formatCallCount).toBe(0);
  });

  it('should_report_support_by_delegating_to_the_formatter', () => {
    const useCase = new FormatCode(
      new StubCodeFormatter({ supports: true, outcome: { kind: 'formatted', code: '' } }),
    );

    expect(useCase.supports('javascript')).toBe(true);
  });
});
