import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '@/adapters/primary/app/App';
import type {
  AckOutcome,
  InboxAcknowledger,
  InboxRead,
  InboxReader,
} from '@/application/ports/ErrorInbox';
import { ErrorReport } from '@/domain/error-reporting/ErrorReport';

class EmptyInboxReader implements InboxReader {
  list(): Promise<InboxRead> {
    return Promise.resolve({ kind: 'loaded', errors: [] });
  }
}

class StubInboxReader implements InboxReader {
  constructor(private readonly errors: readonly ErrorReport[]) {}

  list(): Promise<InboxRead> {
    return Promise.resolve({ kind: 'loaded', errors: this.errors });
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

  it('should_render_the_error_banner_alert_when_inbox_holds_an_error', async () => {
    const setupError = ErrorReport.from({
      id: 'setup-1',
      kind: 'side_panel_setup_failed',
      message: 'Could not configure the side panel.',
      source: 'background',
      severity: 'error',
      occurredAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    render(
      <App
        mode="panel"
        errorReader={new StubInboxReader([setupError])}
        errorAcknowledger={new NoopInboxAcknowledger()}
      />,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Snipworth encountered an unexpected event.',
    );
  });
});
