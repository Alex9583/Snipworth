import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '@/adapters/primary/app/App';
import type {
  AckOutcome,
  InboxAcknowledger,
  InboxRead,
  InboxReader,
} from '@/application/ports/ErrorInbox';

class EmptyInboxReader implements InboxReader {
  list(): Promise<InboxRead> {
    return Promise.resolve({ kind: 'loaded', errors: [] });
  }
}

class NoopInboxAcknowledger implements InboxAcknowledger {
  acknowledge(): Promise<AckOutcome> {
    return Promise.resolve({ kind: 'acknowledged' });
  }
}

describe('App', () => {
  it('should_render_the_boot_label_with_the_provided_mode', () => {
    render(
      <App
        mode="panel"
        errorReader={new EmptyInboxReader()}
        errorAcknowledger={new NoopInboxAcknowledger()}
      />,
    );

    expect(screen.getByText('App boot OK in panel mode.')).toBeInTheDocument();
  });

  it('should_render_the_tab_mode_label_when_mode_is_tab', () => {
    render(
      <App
        mode="tab"
        errorReader={new EmptyInboxReader()}
        errorAcknowledger={new NoopInboxAcknowledger()}
      />,
    );

    expect(screen.getByText('App boot OK in tab mode.')).toBeInTheDocument();
  });
});
