import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  dispatchMessage,
  queueSidePanelFault,
  resetChromeMock,
  SELF_EXTENSION_ID,
} from '../../../setup/chrome-mock';
import { ChromeBrowserHost } from '@/adapters/secondary/browser/ChromeBrowserHost';

beforeEach(() => {
  resetChromeMock();
});

describe('ChromeBrowserHost — onMessage', () => {
  it('should_send_the_handler_response_when_handler_resolves', async () => {
    const onCrash = vi.fn();
    const host = new ChromeBrowserHost(onCrash);
    host.onMessage(() => Promise.resolve({ response: { ok: true, data: 'pong' } }));

    const { response } = await dispatchMessage({ type: 'PING' });

    expect(response).toEqual({ ok: true, data: 'pong' });
    expect(onCrash).not.toHaveBeenCalled();
  });

  it('should_invoke_the_crash_reporter_with_the_cause_when_handler_rejects', async () => {
    const onCrash = vi.fn();
    const host = new ChromeBrowserHost(onCrash);
    const cause = new Error('handler exploded');
    host.onMessage(() => Promise.reject(cause));

    await dispatchMessage({ type: 'PING' });

    expect(onCrash).toHaveBeenCalledWith(cause);
  });

  it('should_send_a_handler_crashed_wire_response_when_handler_rejects', async () => {
    const host = new ChromeBrowserHost(() => undefined);
    host.onMessage(() => Promise.reject(new Error('boom')));

    const { response } = await dispatchMessage({ type: 'PING' });

    expect(response).toEqual({
      ok: false,
      error: {
        code: 'handler_crashed',
        message: 'Snipworth message handler crashed.',
      },
    });
  });

  it('should_expose_chrome_runtime_id_via_selfId', () => {
    const host = new ChromeBrowserHost(() => undefined);

    expect(host.selfId).toBe(SELF_EXTENSION_ID);
  });

  it('should_return_configured_when_setPanelBehavior_resolves', async () => {
    const host = new ChromeBrowserHost(() => undefined);

    const outcome = await host.enableSidePanelOnActionClick();

    expect(outcome).toEqual({ kind: 'configured' });
  });

  it('should_return_failed_with_cause_when_setPanelBehavior_rejects', async () => {
    const cause = new Error('side panel api down');
    queueSidePanelFault({ op: 'setPanelBehavior', cause });
    const host = new ChromeBrowserHost(() => undefined);

    const outcome = await host.enableSidePanelOnActionClick();

    expect(outcome).toEqual({ kind: 'failed', cause });
  });
});
