import { describe, it, expect, beforeEach } from 'vitest';

import { MessagingErrorReporter } from '@/adapters/secondary/error-channel/MessagingErrorReporter';
import { ErrorReport } from '@/domain/error-reporting/ErrorReport';

import { queueRuntimeFault, resetChromeMock } from '../../setup/chrome-mock';

beforeEach(() => {
  resetChromeMock();
});

function respondTo(response: unknown): void {
  chrome.runtime.onMessage.addListener((_msg, _sender, sendResponse) => {
    sendResponse(response);
    return false;
  });
}

function aPanelReport(): ErrorReport {
  return ErrorReport.from({
    id: 'panel-1',
    kind: 'preferences_load_failed',
    message: 'Snipworth could not load saved preferences.',
    occurredAt: new Date('2026-05-09T14:23:05.000Z'),
    source: 'side_panel',
    severity: 'warning',
  });
}

describe('MessagingErrorReporter — report', () => {
  it('should_send_a_REPORT_ERROR_message_carrying_the_report_snapshot', async () => {
    const received: unknown[] = [];
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      received.push(msg);
      sendResponse({ ok: true });
      return false;
    });
    const reporter = new MessagingErrorReporter();

    const outcome = await reporter.report(aPanelReport());

    expect(outcome).toEqual({ kind: 'reported' });
    expect(received).toEqual([{ type: 'REPORT_ERROR', report: aPanelReport().toSnapshot() }]);
  });

  it('should_return_reporter_failed_when_response_is_an_error_envelope', async () => {
    respondTo({
      ok: false,
      error: { code: 'inbox_unavailable', message: 'storage offline' },
    });
    const reporter = new MessagingErrorReporter();

    const outcome = await reporter.report(aPanelReport());

    expect(outcome.kind).toBe('reporter_failed');
    if (outcome.kind !== 'reporter_failed') return;
    expect(outcome.cause).toBeInstanceOf(Error);
    expect((outcome.cause as Error).message).toBe('storage offline');
  });

  it('should_return_reporter_failed_when_sendMessage_rejects', async () => {
    const cause = new Error('worker missing');
    queueRuntimeFault({ op: 'sendMessage', cause });
    const reporter = new MessagingErrorReporter();

    const outcome = await reporter.report(aPanelReport());

    expect(outcome).toEqual({ kind: 'reporter_failed', cause });
  });

  it('should_return_reporter_failed_when_response_is_not_a_well_formed_envelope', async () => {
    respondTo('not-a-response');
    const reporter = new MessagingErrorReporter();

    const outcome = await reporter.report(aPanelReport());

    expect(outcome.kind).toBe('reporter_failed');
  });
});
