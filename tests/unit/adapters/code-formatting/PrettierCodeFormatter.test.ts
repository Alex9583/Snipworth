import { describe, expect, it } from 'vitest';

import { PrettierCodeFormatter } from '@/adapters/secondary/code-formatting/PrettierCodeFormatter';

describe('PrettierCodeFormatter', () => {
  it('should_report_support_for_a_formattable_language', () => {
    const formatter = new PrettierCodeFormatter();

    expect(formatter.supports('javascript')).toBe(true);
  });

  it('should_not_report_support_for_a_language_prettier_cannot_format', () => {
    const formatter = new PrettierCodeFormatter();

    expect(formatter.supports('python')).toBe(false);
  });

  it('should_format_javascript_using_prettier', async () => {
    const formatter = new PrettierCodeFormatter();

    const outcome = await formatter.format('const  x=1', 'javascript');

    expect(outcome).toEqual({ kind: 'formatted', code: 'const x = 1;\n' });
  });

  it('should_format_typescript_using_prettier', async () => {
    const formatter = new PrettierCodeFormatter();

    const outcome = await formatter.format('const  x:number=1', 'typescript');

    expect(outcome).toEqual({ kind: 'formatted', code: 'const x: number = 1;\n' });
  });

  it('should_format_json_using_prettier', async () => {
    const formatter = new PrettierCodeFormatter();

    const outcome = await formatter.format('{"a":1}', 'json');

    expect(outcome).toEqual({ kind: 'formatted', code: '{ "a": 1 }\n' });
  });

  it('should_format_css_using_prettier', async () => {
    const formatter = new PrettierCodeFormatter();

    const outcome = await formatter.format('a{color:red}', 'css');

    expect(outcome).toEqual({ kind: 'formatted', code: 'a {\n  color: red;\n}\n' });
  });

  it('should_return_failed_when_the_code_has_a_syntax_error', async () => {
    const formatter = new PrettierCodeFormatter();

    const outcome = await formatter.format('const x = ;', 'javascript');

    expect(outcome.kind).toBe('failed');
  });

  it.each([
    ['jsx', 'const a=<div/>'],
    ['tsx', 'const a=<App/>'],
    ['scss', '.a{.b{color:red}}'],
    ['less', '.a{.b{color:red}}'],
    ['html', '<div><p>hi</p></div>'],
    ['markdown', '#  Title'],
    ['yaml', 'a:    1'],
    ['graphql', 'query{a}'],
  ])('should_format_%s_using_prettier', async (language, source) => {
    const formatter = new PrettierCodeFormatter();

    const outcome = await formatter.format(source, language);

    expect(outcome.kind).toBe('formatted');
  });
});
