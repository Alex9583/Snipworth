import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useFormatHandle } from '@/adapters/primary/app/useFormatHandle';
import type { FormatOutcome } from '@/application/ports/CodeFormatter';
import { FormatCode } from '@/application/use-cases/FormatCode';

import { StubCodeFormatter } from '../../setup/fakes/StubCodeFormatter';

function aFormatCode(supports: boolean, outcome: FormatOutcome): FormatCode {
  return new FormatCode(new StubCodeFormatter({ supports, outcome }));
}

interface HarnessProps {
  readonly useCase: FormatCode;
  readonly code?: string;
  readonly language?: string;
  readonly applyFormattedCode?: (code: string) => void;
}

function Harness({
  useCase,
  code = 'const x=1',
  language = 'javascript',
  applyFormattedCode = () => undefined,
}: HarnessProps) {
  const { canFormat, onFormat, status } = useFormatHandle({
    useCase,
    code,
    language,
    applyFormattedCode,
  });
  return (
    <>
      <span data-testid="can-format">{String(canFormat)}</span>
      <button onClick={onFormat}>format</button>
      {status ? <p data-testid="status">{status.kind}</p> : null}
    </>
  );
}

describe('useFormatHandle', () => {
  it('should_expose_can_format_true_when_the_use_case_supports_the_language', () => {
    render(<Harness useCase={aFormatCode(true, { kind: 'formatted', code: '' })} />);

    expect(screen.getByTestId('can-format')).toHaveTextContent('true');
  });

  it('should_apply_the_formatted_code_when_the_user_triggers_a_successful_format', async () => {
    const user = userEvent.setup();
    const applied: string[] = [];

    render(
      <Harness
        useCase={aFormatCode(true, { kind: 'formatted', code: 'const x = 1;\n' })}
        applyFormattedCode={(code) => applied.push(code)}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'format' }));

    expect(await screen.findByTestId('status')).toHaveTextContent('formatted');
    expect(applied).toEqual(['const x = 1;\n']);
  });
});
