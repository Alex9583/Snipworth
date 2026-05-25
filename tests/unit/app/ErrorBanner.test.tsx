import { describe, it, expect } from 'vitest';
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
  readonly resolveListLater?: boolean;
}

class FakeInboxReader implements InboxReader {
  private readonly initial: readonly ErrorReport[];
  private readonly listFailure: Error | undefined;
  private readonly delayList: boolean;
  private resolveDeferredList: (() => void) | undefined;

  constructor(opts: FakeReaderOptions = {}) {
    this.initial = opts.initial ?? [];
    this.listFailure = opts.listFailsWith;
    this.delayList = opts.resolveListLater ?? false;
  }

  list(): Promise<InboxRead> {
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
  readonly backgroundFailsWith?: {
    readonly code: 'handler_crashed' | 'unauthorized_sender' | 'malformed_request';
    readonly message: string;
  };
}

type BackgroundFailure = NonNullable<FakeAcknowledgerOptions['backgroundFailsWith']>;

class FakeInboxAcknowledger implements InboxAcknowledger {
  private readonly failure: Error | undefined;
  private readonly backgroundFailure: FakeAcknowledgerOptions['backgroundFailsWith'];
  readonly calls: (readonly string[])[] = [];

  constructor(opts: FakeAcknowledgerOptions = {}) {
    this.failure = opts.failsWith;
    this.backgroundFailure = opts.backgroundFailsWith;
  }

  acknowledge(ids: readonly string[]): Promise<AckOutcome> {
    this.calls.push([...ids]);
    if (this.failure !== undefined) {
      return Promise.resolve({ kind: 'inbox_unavailable', cause: this.failure });
    }
    if (this.backgroundFailure !== undefined) {
      return Promise.resolve({
        kind: 'background_failed',
        code: this.backgroundFailure.code,
        message: this.backgroundFailure.message,
      });
    }
    return Promise.resolve({ kind: 'acknowledged' });
  }
}

const anEmptyInbox = (): FakeInboxReader => new FakeInboxReader();
const anInboxWith = (...errors: ErrorReport[]): FakeInboxReader =>
  new FakeInboxReader({ initial: errors });
const anUnavailableInbox = (cause: Error): FakeInboxReader =>
  new FakeInboxReader({ listFailsWith: cause });
const aPendingInboxWith = (...errors: ErrorReport[]): FakeInboxReader =>
  new FakeInboxReader({ initial: errors, resolveListLater: true });

const aWorkingAcknowledger = (): FakeInboxAcknowledger => new FakeInboxAcknowledger();
const aFailingAcknowledger = (cause: Error): FakeInboxAcknowledger =>
  new FakeInboxAcknowledger({ failsWith: cause });
const aBackgroundFailingAcknowledger = (failure: BackgroundFailure): FakeInboxAcknowledger =>
  new FakeInboxAcknowledger({ backgroundFailsWith: failure });

function renderBanner(opts: { reader: InboxReader; acknowledger: InboxAcknowledger }) {
  const user = userEvent.setup();
  const view = render(<ErrorBanner reader={opts.reader} acknowledger={opts.acknowledger} />);
  return { user, view };
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
    renderBanner({ reader: anEmptyInbox(), acknowledger: aWorkingAcknowledger() });

    await waitFor(() => {
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });

  it('should_render_an_alert_when_inbox_holds_one_error', async () => {
    renderBanner({ reader: anInboxWith(aSetupError), acknowledger: aWorkingAcknowledger() });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Snipworth encountered an unexpected event.',
    );
  });

  it('should_render_a_pluralised_alert_when_inbox_holds_multiple_errors', async () => {
    renderBanner({
      reader: anInboxWith(aSetupError, anotherInvalidMessage),
      acknowledger: aWorkingAcknowledger(),
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Snipworth encountered 2 unexpected events.',
    );
  });

  it('should_link_to_the_bug_report_template_with_the_error_kind_in_the_console_field', async () => {
    renderBanner({ reader: anInboxWith(aSetupError), acknowledger: aWorkingAcknowledger() });

    const link = await screen.findByRole('link', { name: /report/i });
    const url = new URL(link.getAttribute('href') ?? '');
    expect(url.pathname).toContain('/issues/new');
    expect(url.searchParams.get('template')).toBe('bug_report.yml');
    expect(url.searchParams.get('console')).toContain('side_panel_setup_failed');
  });
});

describe('ErrorBanner — dismiss flow', () => {
  it('should_disappear_when_user_dismisses_the_banner', async () => {
    const { user } = renderBanner({
      reader: anInboxWith(aSetupError),
      acknowledger: aWorkingAcknowledger(),
    });
    await screen.findByRole('alert');

    await user.click(screen.getByRole('button', { name: /dismiss/i }));

    await waitFor(() => {
      expect(screen.queryByRole('alert')).toBeNull();
    });
  });

  it('should_pass_loaded_error_ids_to_acknowledge_when_user_dismisses', async () => {
    const acknowledger = aWorkingAcknowledger();
    const { user } = renderBanner({
      reader: anInboxWith(aSetupError, anotherInvalidMessage),
      acknowledger,
    });
    await screen.findByRole('alert');

    await user.click(screen.getByRole('button', { name: /dismiss/i }));

    expect(acknowledger.calls).toEqual([[aSetupError.id, anotherInvalidMessage.id]]);
  });
});

describe('ErrorBanner — unavailable paths', () => {
  it('should_render_unavailable_alert_when_inbox_list_returns_inbox_unavailable', async () => {
    renderBanner({
      reader: anUnavailableInbox(new Error('storage offline')),
      acknowledger: aWorkingAcknowledger(),
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Snipworth could not read its pending error inbox.',
    );
  });

  it('should_disable_the_dismiss_button_when_inbox_is_unavailable', async () => {
    renderBanner({
      reader: anUnavailableInbox(new Error('storage offline')),
      acknowledger: aWorkingAcknowledger(),
    });
    await screen.findByRole('alert');

    expect(screen.getByRole('button', { name: /dismiss/i })).toBeDisabled();
  });

  it('should_not_call_acknowledge_when_dismiss_is_clicked_while_inbox_is_unavailable', async () => {
    const acknowledger = aWorkingAcknowledger();
    const { user } = renderBanner({
      reader: anUnavailableInbox(new Error('storage offline')),
      acknowledger,
    });
    await screen.findByRole('alert');

    await user.click(screen.getByRole('button', { name: /dismiss/i }));

    expect(acknowledger.calls).toEqual([]);
  });
});

describe('ErrorBanner — dismiss failure paths', () => {
  it('should_keep_errors_visible_when_acknowledge_returns_inbox_unavailable', async () => {
    const { user } = renderBanner({
      reader: anInboxWith(aSetupError),
      acknowledger: aFailingAcknowledger(new Error('storage offline')),
    });
    await screen.findByRole('alert');

    await user.click(screen.getByRole('button', { name: /dismiss/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Snipworth encountered an unexpected event.',
    );
  });

  it('should_include_the_dismiss_failure_cause_in_the_report_payload_when_acknowledge_fails', async () => {
    const { user } = renderBanner({
      reader: anInboxWith(aSetupError),
      acknowledger: aFailingAcknowledger(new Error('storage offline')),
    });
    await screen.findByRole('alert');

    await user.click(screen.getByRole('button', { name: /dismiss/i }));

    const link = await screen.findByRole('link', { name: /report/i });
    const url = new URL(link.getAttribute('href') ?? '');
    expect(url.searchParams.get('what-happened')).toContain('storage offline');
  });

  it('should_keep_errors_visible_when_acknowledge_returns_background_failed', async () => {
    const { user } = renderBanner({
      reader: anInboxWith(aSetupError),
      acknowledger: aBackgroundFailingAcknowledger({
        code: 'handler_crashed',
        message: 'handler threw',
      }),
    });
    await screen.findByRole('alert');

    await user.click(screen.getByRole('button', { name: /dismiss/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Snipworth encountered an unexpected event.',
    );
  });

  it('should_include_the_background_failure_code_in_the_report_payload_when_acknowledge_returns_background_failed', async () => {
    const { user } = renderBanner({
      reader: anInboxWith(aSetupError),
      acknowledger: aBackgroundFailingAcknowledger({
        code: 'handler_crashed',
        message: 'handler threw',
      }),
    });
    await screen.findByRole('alert');

    await user.click(screen.getByRole('button', { name: /dismiss/i }));

    const link = await screen.findByRole('link', { name: /report/i });
    const url = new URL(link.getAttribute('href') ?? '');
    expect(url.searchParams.get('what-happened')).toContain('handler_crashed');
  });
});

describe('ErrorBanner — lifecycle', () => {
  it('should_not_set_state_after_unmount_when_list_resolves_late', async () => {
    const reader = aPendingInboxWith(aSetupError);
    const { view } = renderBanner({ reader, acknowledger: aWorkingAcknowledger() });

    view.unmount();
    reader.releasePendingList();

    await Promise.resolve();
    await Promise.resolve();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
