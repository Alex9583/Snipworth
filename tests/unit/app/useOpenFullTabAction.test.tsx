import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { useOpenFullTabAction } from '@/adapters/primary/app/useOpenFullTabAction';
import {
  OpenFullTabEditor,
  type OpenFullTabEditorOutcome,
} from '@/application/use-cases/OpenFullTabEditor';
import type { CaptureCourier, DeliverCaptureOutcome } from '@/application/ports/CaptureCourier';
import type { FullTabOpener, OpenFullTabOutcome } from '@/application/ports/FullTabOpener';
import type { CapturedSelection } from '@/domain/capture/CapturedSelection';

class StubCourier implements CaptureCourier {
  readonly deliveries: CapturedSelection[] = [];

  deliver(selection: CapturedSelection): Promise<DeliverCaptureOutcome> {
    this.deliveries.push(selection);
    return Promise.resolve({ kind: 'delivered' });
  }
}

class SpyOpener implements FullTabOpener {
  readonly calls: number[] = [];
  constructor(private readonly outcome: OpenFullTabOutcome) {}
  async openFullTab(): Promise<OpenFullTabOutcome> {
    this.calls.push(Date.now());
    await Promise.resolve();
    return this.outcome;
  }
}

interface HarnessProps {
  readonly useCase: OpenFullTabEditor;
  readonly code: string;
  readonly onOutcome?: (outcome: OpenFullTabEditorOutcome) => void;
}

function Harness({ useCase, code, onOutcome }: HarnessProps) {
  const onOpen = useOpenFullTabAction(useCase, code, onOutcome);
  return <button onClick={onOpen}>open</button>;
}

describe('useOpenFullTabAction', () => {
  it('should_invoke_the_use_case_with_the_provided_code_when_the_returned_handler_is_called', async () => {
    const user = userEvent.setup();
    const courier = new StubCourier();
    const opener = new SpyOpener({ kind: 'opened' });
    const useCase = new OpenFullTabEditor(courier, opener);
    render(<Harness useCase={useCase} code="const x = 1;" />);

    await user.click(screen.getByRole('button', { name: 'open' }));
    await Promise.resolve();

    expect(courier.deliveries).toHaveLength(1);
    expect(courier.deliveries[0]?.code).toBe('const x = 1;');
    expect(opener.calls).toHaveLength(1);
  });

  it('should_invoke_the_outcome_listener_with_open_failed_when_opener_rejects', async () => {
    const user = userEvent.setup();
    const cause = new Error('chrome rejected');
    const courier = new StubCourier();
    const opener = new SpyOpener({ kind: 'open_failed', cause });
    const useCase = new OpenFullTabEditor(courier, opener);
    const observed: OpenFullTabEditorOutcome[] = [];
    render(
      <Harness
        useCase={useCase}
        code="const x = 1;"
        onOutcome={(outcome) => observed.push(outcome)}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'open' }));
    await Promise.resolve();
    await Promise.resolve();

    expect(observed).toEqual([{ kind: 'open_failed', cause }]);
  });
});
