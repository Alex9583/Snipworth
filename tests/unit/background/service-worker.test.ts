import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dispatchMessage, dispatchInstalled, resetChromeMock } from '../../setup/chrome-mock';

beforeEach(async () => {
  vi.resetModules();
  resetChromeMock();
  await import('@/background/service-worker');
});

describe('service worker — onMessage', () => {
  it('responds to PING with {ok: true, data: "pong"}', () => {
    const { response, asyncExpected } = dispatchMessage({ type: 'PING' });
    expect(response).toEqual({ ok: true, data: 'pong' });
    expect(asyncExpected).toBe(false);
  });

  it('responds to OPEN_FULL_TAB with not-implemented (until handler ships)', () => {
    const { response } = dispatchMessage({ type: 'OPEN_FULL_TAB' });
    expect(response).toEqual({ ok: false, error: 'not implemented: OPEN_FULL_TAB' });
  });

  it('responds to LOAD_CODE with not-implemented (until handler ships)', () => {
    const { response } = dispatchMessage({ type: 'LOAD_CODE', code: 'const x = 1;' });
    expect(response).toEqual({ ok: false, error: 'not implemented: LOAD_CODE' });
  });

  it('rejects malformed messages with a generic error and warns to console', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { response } = dispatchMessage({ type: 'UNKNOWN' });
    expect(response).toEqual({ ok: false, error: 'malformed message' });
    expect(warn).toHaveBeenCalledWith('[snipworth] ignored malformed message', expect.any(Array));
    warn.mockRestore();
  });

  it('rejects null payload with malformed-message error', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { response } = dispatchMessage(null);
    expect(response).toEqual({ ok: false, error: 'malformed message' });
    warn.mockRestore();
  });

  it('returns sync (asyncExpected = false) on every branch', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(dispatchMessage({ type: 'PING' }).asyncExpected).toBe(false);
    expect(dispatchMessage({ type: 'OPEN_FULL_TAB' }).asyncExpected).toBe(false);
    expect(dispatchMessage(null).asyncExpected).toBe(false);
    warn.mockRestore();
  });

  it('does not leak inherited prototype properties past the schema', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const obj = Object.create({ type: 'PING' }) as object;
    const { response } = dispatchMessage(obj);
    expect(response).toEqual({ ok: false, error: 'malformed message' });
    warn.mockRestore();
  });
});

describe('service worker — onInstalled', () => {
  it('calls setPanelBehavior with openPanelOnActionClick: true', () => {
    const setBehavior = vi.spyOn(chrome.sidePanel, 'setPanelBehavior');
    dispatchInstalled();
    expect(setBehavior).toHaveBeenCalledWith({ openPanelOnActionClick: true });
  });

  it('logs and swallows the error if setPanelBehavior rejects', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const boom = new Error('boom');
    vi.spyOn(chrome.sidePanel, 'setPanelBehavior').mockRejectedValueOnce(boom);

    expect(() => {
      dispatchInstalled();
    }).not.toThrow();

    await vi.waitFor(() => {
      expect(errSpy).toHaveBeenCalledWith('[snipworth] setPanelBehavior failed', boom);
    });

    errSpy.mockRestore();
  });
});
