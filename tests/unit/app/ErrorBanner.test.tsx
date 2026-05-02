import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBanner } from '@/adapters/primary/app/ErrorBanner';
import type {
  AckOutcome,
  InboxAcknowledger,
  InboxRead,
  InboxReader,
} from '@/application/ports/ErrorInbox';
import { ErrorReport } from '@/domain/error-reporting/ErrorReport';

interface FakeReaderOptions {
  readonly initial?: readonly ErrorReport[];
  readonly listFailsWith?: Error;
  readonly listRejectsWith?: Error;
  readonly resolveListLater?: boolean;
}

class FakeInboxReader implements InboxReader {
  private readonly initial: readonly ErrorReport[];
  private readonly listFailure: Error | undefined;
  private readonly listRejection: Error | undefined;
  private readonly delayList: boolean;
  private resolveDeferredList: (() => void) | undefined;

  constructor(opts: FakeReaderOptions = {}) {
    this.initial = opts.initial ?? [];
    this.listFailure = opts.listFailsWith;
    this.listRejection = opts.listRejectsWith;
    this.delayList = opts.resolveListLater ?? false;
  }

  list(): Promise<InboxRead> {
    if (this.listRejection !== undefined) return Promise.reject(this.listRejection);
    if (this.listFailure !== undefined) {
      return Promise.resolve({ kind: 'inbox_unavailable', cause: this.listFailure });
    }
    if (this.delayList) {
      return new Promise<InboxRead>((resolve) => {
        this.resolveDeferredList = () => {
          resolve({ kind: 'loaded', errors: this.initial });
        };
      });
    }
    return Promise.resolve({ kind: 'loaded', errors: this.initial });
  }

  releasePendingList(): void {
    this.resolveDeferredList?.();
  }
}

interface FakeAcknowledgerOptions {
  readonly failsWith?: Error;
  readonly rejectsWith?: Error;
}

class FakeInboxAcknowledger implements InboxAcknowledger {
  private readonly failure: Error | undefined;
  private readonly rejection: Error | undefined;
  readonly calls: (readonly string[])[] = [];

  constructor(opts: FakeAcknowledgerOptions = {}) {
    this.failure = opts.failsWith;
    this.rejection = opts.rejectsWith;
  }

  acknowledge(ids: readonly string[]): Promise<AckOutcome> {
    this.calls.push([...ids]);
    if (this.rejection !== undefined) return Promise.reject(this.rejection);
    if (this.failure !== undefined) {
      return Promise.resolve({ kind: 'inbox_unavailable', cause: this.failure });
    }
    return Promise.resolve({ kind: 'acknowledged' });
  }
}

const aSetupError = ErrorReport.from({
  id: 'setup-1',
  kind: 'side_panel_setup_failed',
  message: 'Could not configure the side panel.',
  source: 'background',
  severity: 'error',
  occurredAt: new Date('2026-01-01T00:00:00.000Z'),
});

const anotherInvalidMessage = ErrorReport.from({
  id: 'invalid-1',
  kind: 'invalid_message',
  message: 'A second unexpected event.',
  source: 'router',
  severity: 'warning',
  occurredAt: new Date('2026-01-01T00:00:01.000Z'),
});

describe('ErrorBanner — loaded paths', () => {
  it('should_render_nothing_when_inbox_is_empty', async () => {
    const reader = new FakeInboxReader();
    const acknowledger = new FakeInboxAcknowledger();

    render(<ErrorBanner reader={reader} acknowledger={acknowledger} />);

    await waitFor(() => {
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });

  it('should_render_an_alert_when_inbox_holds_one_error', async () => {
    const reader = new FakeInboxReader({ initial: [aSetupError] });
    const acknowledger = new FakeInboxAcknowledger();

    render(<ErrorBanner reader={reader} acknowledger={acknowledger} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Snipworth encountered an unexpected event.',
    );
  });

  it('should_render_a_pluralised_alert_when_inbox_holds_multiple_errors', async () => {
    const reader = new FakeInboxReader({ initial: [aSetupError, anotherInvalidMessage] });
    const acknowledger = new FakeInboxAcknowledger();

    render(<ErrorBanner reader={reader} acknowledger={acknowledger} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Snipworth encountered 2 unexpected events.',
    );
  });

  it('should_link_to_an_issue_creation_form_with_a_url_encoded_body_containing_the_error_kind', async () => {
    const reader = new FakeInboxReader({ initial: [aSetupError] });
    const acknowledger = new FakeInboxAcknowledger();

    render(<ErrorBanner reader={reader} acknowledger={acknowledger} />);

    const link = await screen.findByRole('link', { name: /report/i });
    const href = link.getAttribute('href') ?? '';
    expect(href).toContain('/issues/new');
    expect(href).toMatch(/\?body=/);
    const decodedBody = decodeURIComponent(href.split('?body=')[1] ?? '');
    expect(decodedBody).toContain('side_panel_setup_failed');
  });
});

describe('ErrorBanner — dismiss flow', () => {
  it('should_disappear_when_user_dismisses_the_banner', async () => {
    const user = userEvent.setup();
    const reader = new FakeInboxReader({ initial: [aSetupError] });
    const acknowledger = new FakeInboxAcknowledger();

    render(<ErrorBanner reader={reader} acknowledger={acknowledger} />);
    await screen.findByRole('alert');

    await user.click(screen.getByRole('button', { name: /dismiss/i }));

    await waitFor(() => {
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });

  it('should_pass_loaded_error_ids_to_acknowledge_when_user_dismisses', async () => {
    const user = userEvent.setup();
    const reader = new FakeInboxReader({ initial: [aSetupError, anotherInvalidMessage] });
    const acknowledger = new FakeInboxAcknowledger();

    render(<ErrorBanner reader={reader} acknowledger={acknowledger} />);
    await screen.findByRole('alert');

    await user.click(screen.getByRole('button', { name: /dismiss/i }));

    expect(acknowledger.calls).toEqual([[aSetupError.id, anotherInvalidMessage.id]]);
  });
});

describe('ErrorBanner — unavailable paths', () => {
  it('should_render_unavailable_alert_when_inbox_list_returns_inbox_unavailable', async () => {
    const reader = new FakeInboxReader({ listFailsWith: new Error('storage offline') });
    const acknowledger = new FakeInboxAcknowledger();

    render(<ErrorBanner reader={reader} acknowledger={acknowledger} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Snipworth could not read its pending error inbox.',
    );
  });

  it('should_render_unavailable_alert_when_inbox_list_rejects_unexpectedly', async () => {
    const reader = new FakeInboxReader({ listRejectsWith: new Error('list crashed') });
    const acknowledger = new FakeInboxAcknowledger();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(<ErrorBanner reader={reader} acknowledger={acknowledger} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Snipworth could not read its pending error inbox.',
    );
    consoleError.mockRestore();
  });

  it('should_disable_the_dismiss_button_when_inbox_is_unavailable', async () => {
    const reader = new FakeInboxReader({ listFailsWith: new Error('storage offline') });
    const acknowledger = new FakeInboxAcknowledger();

    render(<ErrorBanner reader={reader} acknowledger={acknowledger} />);
    await screen.findByRole('alert');

    expect(screen.getByRole('button', { name: /dismiss/i })).toBeDisabled();
  });

  it('should_not_call_acknowledge_when_dismiss_is_clicked_while_inbox_is_unavailable', async () => {
    const user = userEvent.setup();
    const reader = new FakeInboxReader({ listFailsWith: new Error('storage offline') });
    const acknowledger = new FakeInboxAcknowledger();

    render(<ErrorBanner reader={reader} acknowledger={acknowledger} />);
    await screen.findByRole('alert');

    await user.click(screen.getByRole('button', { name: /dismiss/i }));

    expect(acknowledger.calls).toEqual([]);
  });

  it('should_flip_to_unavailable_when_acknowledge_returns_inbox_unavailable', async () => {
    const user = userEvent.setup();
    const reader = new FakeInboxReader({ initial: [aSetupError] });
    const acknowledger = new FakeInboxAcknowledger({ failsWith: new Error('storage offline') });

    render(<ErrorBanner reader={reader} acknowledger={acknowledger} />);
    await screen.findByRole('alert');

    await user.click(screen.getByRole('button', { name: /dismiss/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Snipworth could not read its pending error inbox.',
    );
  });

  it('should_flip_to_unavailable_when_acknowledge_rejects_unexpectedly', async () => {
    const user = userEvent.setup();
    const reader = new FakeInboxReader({ initial: [aSetupError] });
    const acknowledger = new FakeInboxAcknowledger({ rejectsWith: new Error('ack crashed') });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(<ErrorBanner reader={reader} acknowledger={acknowledger} />);
    await screen.findByRole('alert');

    await user.click(screen.getByRole('button', { name: /dismiss/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Snipworth could not read its pending error inbox.',
    );
    consoleError.mockRestore();
  });
});

describe('ErrorBanner — lifecycle', () => {
  it('should_not_set_state_after_unmount_when_list_resolves_late', async () => {
    const reader = new FakeInboxReader({
      initial: [aSetupError],
      resolveListLater: true,
    });
    const acknowledger = new FakeInboxAcknowledger();

    const view = render(<ErrorBanner reader={reader} acknowledger={acknowledger} />);
    view.unmount();
    reader.releasePendingList();

    await Promise.resolve();
    await Promise.resolve();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
