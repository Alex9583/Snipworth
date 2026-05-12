import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { useOpenFullTabAction } from '@/adapters/primary/app/useOpenFullTabAction';
import type { FullTabOpener, OpenFullTabOutcome } from '@/application/ports/FullTabOpener';

class SpyFullTabOpener implements FullTabOpener {
  readonly calls: number[] = [];
  constructor(private readonly outcome: OpenFullTabOutcome) {}
  async openFullTab(): Promise<OpenFullTabOutcome> {
    this.calls.push(Date.now());
    await Promise.resolve();
    return this.outcome;
  }
}

interface HarnessProps {
  readonly opener: FullTabOpener;
  readonly onOutcome?: (outcome: OpenFullTabOutcome) => void;
}

function Harness({ opener, onOutcome }: HarnessProps) {
  const onOpen = useOpenFullTabAction(opener, onOutcome);
  return <button onClick={onOpen}>open</button>;
}

describe('useOpenFullTabAction', () => {
  it('should_invoke_the_opener_when_the_returned_handler_is_called', async () => {
    const user = userEvent.setup();
    const opener = new SpyFullTabOpener({ kind: 'opened' });
    render(<Harness opener={opener} />);

    await user.click(screen.getByRole('button', { name: 'open' }));

    expect(opener.calls).toHaveLength(1);
  });

  it('should_invoke_the_outcome_listener_with_open_failed_when_chrome_rejects', async () => {
    const user = userEvent.setup();
    const cause = new Error('chrome rejected');
    const opener = new SpyFullTabOpener({ kind: 'open_failed', cause });
    const observed: OpenFullTabOutcome[] = [];
    render(<Harness opener={opener} onOutcome={(outcome) => observed.push(outcome)} />);

    await user.click(screen.getByRole('button', { name: 'open' }));
    await Promise.resolve();
    await Promise.resolve();

    expect(observed).toEqual([{ kind: 'open_failed', cause }]);
  });
});
