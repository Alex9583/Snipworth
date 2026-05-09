import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  dispatchContextMenuClick,
  dispatchMessage,
  queueSidePanelFault,
  readCreatedMenus,
  resetChromeMock,
  SELF_EXTENSION_ID,
  withRuntimeLastError,
} from '../../../setup/chrome-mock';
import {
  CAPTURE_MENU_ID,
  CAPTURE_MENU_TITLE,
  ChromeBrowserHost,
} from '@/adapters/secondary/browser/ChromeBrowserHost';

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

describe('ChromeBrowserHost — installCaptureContextMenu', () => {
  it('should_register_a_menu_item_with_the_capture_id_and_a_selection_context', async () => {
    const host = new ChromeBrowserHost(() => undefined);

    const outcome = await host.installCaptureContextMenu();

    expect(outcome).toEqual({ kind: 'installed' });
    const menus = readCreatedMenus();
    expect(menus).toHaveLength(1);
    expect(menus[0]?.id).toBe(CAPTURE_MENU_ID);
    expect(menus[0]?.properties.title).toBe(CAPTURE_MENU_TITLE);
    expect(menus[0]?.properties.contexts).toEqual(['selection']);
  });

  it('should_return_failed_with_cause_when_chrome_runtime_lastError_is_set', async () => {
    const host = new ChromeBrowserHost(() => undefined);
    const original = chrome.contextMenus.create;
    chrome.contextMenus.create = (_props, callback?: () => void) => {
      withRuntimeLastError('duplicate id', () => callback?.());
      return CAPTURE_MENU_ID;
    };

    try {
      const outcome = await host.installCaptureContextMenu();

      expect(outcome.kind).toBe('failed');
      if (outcome.kind === 'failed') {
        expect(outcome.cause).toBeInstanceOf(Error);
        expect((outcome.cause as Error).message).toBe('duplicate id');
      }
    } finally {
      chrome.contextMenus.create = original;
    }
  });
});

describe('ChromeBrowserHost — onCaptureRequested', () => {
  it('should_invoke_the_handler_with_selection_text_pageUrl_and_tab_id_when_capture_menu_is_clicked', async () => {
    const host = new ChromeBrowserHost(() => undefined);
    const handler = vi.fn();
    host.onCaptureRequested(handler);

    dispatchContextMenuClick(
      {
        menuItemId: CAPTURE_MENU_ID,
        editable: false,
        selectionText: 'const x = 1;',
        pageUrl: 'https://example.com/page',
      },
      { id: 7 } as chrome.tabs.Tab,
    );
    await Promise.resolve();

    expect(handler).toHaveBeenCalledWith({
      code: 'const x = 1;',
      sourceUrl: 'https://example.com/page',
      tabId: 7,
    });
  });

  it('should_pass_an_undefined_source_url_when_pageUrl_is_missing', async () => {
    const host = new ChromeBrowserHost(() => undefined);
    const handler = vi.fn();
    host.onCaptureRequested(handler);

    dispatchContextMenuClick(
      {
        menuItemId: CAPTURE_MENU_ID,
        editable: false,
        selectionText: 'a',
      },
      { id: 1 } as chrome.tabs.Tab,
    );
    await Promise.resolve();

    expect(handler).toHaveBeenCalledWith({ code: 'a', sourceUrl: undefined, tabId: 1 });
  });

  it('should_ignore_clicks_on_other_menu_items', async () => {
    const host = new ChromeBrowserHost(() => undefined);
    const handler = vi.fn();
    host.onCaptureRequested(handler);

    dispatchContextMenuClick(
      {
        menuItemId: 'some-other-menu',
        editable: false,
        selectionText: 'a',
      },
      { id: 1 } as chrome.tabs.Tab,
    );
    await Promise.resolve();

    expect(handler).not.toHaveBeenCalled();
  });

  it('should_ignore_clicks_when_selection_text_is_missing', async () => {
    const host = new ChromeBrowserHost(() => undefined);
    const handler = vi.fn();
    host.onCaptureRequested(handler);

    dispatchContextMenuClick({ menuItemId: CAPTURE_MENU_ID, editable: false }, {
      id: 1,
    } as chrome.tabs.Tab);
    await Promise.resolve();

    expect(handler).not.toHaveBeenCalled();
  });

  it('should_ignore_clicks_when_tab_id_is_missing', async () => {
    const host = new ChromeBrowserHost(() => undefined);
    const handler = vi.fn();
    host.onCaptureRequested(handler);

    dispatchContextMenuClick(
      { menuItemId: CAPTURE_MENU_ID, editable: false, selectionText: 'a' },
      undefined,
    );
    await Promise.resolve();

    expect(handler).not.toHaveBeenCalled();
  });

  it('should_invoke_the_crash_reporter_with_the_cause_when_handler_rejects', async () => {
    const onCrash = vi.fn();
    const host = new ChromeBrowserHost(onCrash);
    const cause = new Error('handler exploded');
    host.onCaptureRequested(() => Promise.reject(cause));

    dispatchContextMenuClick({ menuItemId: CAPTURE_MENU_ID, editable: false, selectionText: 'a' }, {
      id: 1,
    } as chrome.tabs.Tab);
    await Promise.resolve();
    await Promise.resolve();

    expect(onCrash).toHaveBeenCalledWith(cause);
  });
});
