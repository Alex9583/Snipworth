import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FormatButton } from '@/adapters/primary/app/ui/FormatButton';

const noop = (): void => undefined;

describe('FormatButton', () => {
  it('should_render_a_format_button_when_the_language_is_formattable', () => {
    render(<FormatButton canFormat onFormat={noop} status={null} />);

    expect(screen.getByRole('button', { name: /format/i })).toBeInTheDocument();
  });

  it('should_render_nothing_when_the_language_is_not_formattable', () => {
    render(<FormatButton canFormat={false} onFormat={noop} status={null} />);

    expect(screen.queryByRole('button', { name: /format/i })).not.toBeInTheDocument();
  });

  it('should_invoke_onFormat_when_clicked', async () => {
    const user = userEvent.setup();
    let formatRequests = 0;

    render(
      <FormatButton
        canFormat
        onFormat={() => {
          formatRequests += 1;
        }}
        status={null}
      />,
    );

    await user.click(screen.getByRole('button', { name: /format/i }));

    expect(formatRequests).toBe(1);
  });

  it('should_show_a_failure_message_when_the_last_format_attempt_failed', () => {
    render(
      <FormatButton
        canFormat
        onFormat={noop}
        status={{ kind: 'failed', cause: new Error('boom') }}
      />,
    );

    expect(screen.getByText(/couldn't format/i)).toBeInTheDocument();
  });

  it('should_announce_the_failure_message_to_assistive_technology_when_formatting_fails', () => {
    render(
      <FormatButton
        canFormat
        onFormat={noop}
        status={{ kind: 'failed', cause: new Error('boom') }}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/couldn't format/i);
  });

  it('should_not_show_the_failure_message_when_the_last_format_attempt_did_not_fail', () => {
    render(
      <FormatButton canFormat onFormat={noop} status={{ kind: 'formatted', code: 'x = 1;\n' }} />,
    );

    expect(screen.queryByText(/couldn't format/i)).not.toBeInTheDocument();
  });
});
