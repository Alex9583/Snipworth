import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useAsyncAction } from '@/adapters/primary/app/useAsyncAction';

import { deferred } from '../../setup/deferred';

interface AnOutcome {
  readonly kind: string;
}

interface HarnessProps {
  readonly run: () => Promise<AnOutcome> | null;
  readonly onOutcome?: (outcome: AnOutcome) => void;
}

function Harness({ run, onOutcome }: HarnessProps) {
  const { trigger, status } = useAsyncAction(run, onOutcome);
  return (
    <>
      <button onClick={trigger}>trigger</button>
      {status && <p data-testid="status">{status.kind}</p>}
    </>
  );
}

describe('useAsyncAction', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should_expose_the_resolved_outcome_as_status_when_run_resolves', async () => {
    const user = userEvent.setup();
    render(<Harness run={() => Promise.resolve({ kind: 'success' })} />);

    await user.click(screen.getByRole('button', { name: 'trigger' }));

    expect(await screen.findByTestId('status')).toHaveTextContent('success');
  });

  it('should_not_invoke_the_listener_or_set_status_when_run_returns_null', async () => {
    const user = userEvent.setup();
    const observed: AnOutcome[] = [];
    render(<Harness run={() => null} onOutcome={(outcome) => observed.push(outcome)} />);

    await user.click(screen.getByRole('button', { name: 'trigger' }));
    await act(async () => {
      await Promise.resolve();
    });

    expect(observed).toEqual([]);
    expect(screen.queryByTestId('status')).toBeNull();
  });

  it('should_invoke_the_outcome_listener_when_run_resolves', async () => {
    const user = userEvent.setup();
    const observed: AnOutcome[] = [];
    render(
      <Harness
        run={() => Promise.resolve({ kind: 'done' })}
        onOutcome={(outcome) => observed.push(outcome)}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'trigger' }));
    await screen.findByTestId('status');

    expect(observed).toEqual([{ kind: 'done' }]);
  });

  it('should_invoke_the_outcome_listener_even_when_component_unmounts_before_resolution', async () => {
    const user = userEvent.setup();
    const work = deferred<AnOutcome>();
    const observed: AnOutcome[] = [];
    const { unmount } = render(
      <Harness run={() => work.promise} onOutcome={(outcome) => observed.push(outcome)} />,
    );

    await user.click(screen.getByRole('button', { name: 'trigger' }));
    unmount();

    await act(async () => {
      work.resolve({ kind: 'late' });
      await Promise.resolve();
    });

    expect(observed).toEqual([{ kind: 'late' }]);
  });

  it('should_clear_the_status_after_5_seconds_so_it_does_not_linger_on_screen', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<Harness run={() => Promise.resolve({ kind: 'copied' })} />);

      await user.click(screen.getByRole('button', { name: 'trigger' }));
      expect(await screen.findByTestId('status')).toHaveTextContent('copied');

      await act(async () => {
        vi.advanceTimersByTime(5000);
        await Promise.resolve();
      });

      expect(screen.queryByTestId('status')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('should_invoke_the_latest_listener_when_the_listener_changes_between_trigger_and_resolution', async () => {
    const user = userEvent.setup();
    const work = deferred<AnOutcome>();
    const earlyObserved: AnOutcome[] = [];
    const lateObserved: AnOutcome[] = [];

    const { rerender } = render(
      <Harness run={() => work.promise} onOutcome={(outcome) => earlyObserved.push(outcome)} />,
    );

    await user.click(screen.getByRole('button', { name: 'trigger' }));

    rerender(
      <Harness run={() => work.promise} onOutcome={(outcome) => lateObserved.push(outcome)} />,
    );

    await act(async () => {
      work.resolve({ kind: 'resolved' });
      await Promise.resolve();
    });

    expect(earlyObserved).toEqual([]);
    expect(lateObserved).toEqual([{ kind: 'resolved' }]);
  });
});
