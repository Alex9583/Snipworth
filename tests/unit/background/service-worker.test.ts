import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  dispatchContextMenuClick,
  dispatchInstalled,
  dispatchMessage,
  dispatchStartup,
  queueSidePanelFault,
  queueStorageFault,
  readBadge,
  readBehavior,
  readCreatedMenus,
  readSession,
  readSidePanelOpens,
  resetChromeMock,
} from '../../setup/chrome-mock';
import { CAPTURE_MENU_ID } from '@/adapters/secondary/browser/ChromeBrowserHost';
import { PENDING_CAPTURE_KEY } from '@/adapters/secondary/capture/pendingCaptureKey';

beforeEach(async () => {
  vi.resetModules();
  resetChromeMock();
  await import('@/adapters/primary/background/service-worker');
});

describe('service worker — onMessage', () => {
  it('should_respond_to_PING_with_pong', async () => {
    const { response } = await dispatchMessage({ type: 'PING' });
    expect(response).toEqual({ ok: true, data: 'pong' });
  });

  it('should_respond_with_malformed_error_when_message_type_is_unknown', async () => {
    const { response } = await dispatchMessage({ type: 'UNKNOWN' });
    expect(response).toEqual({
      ok: false,
      error: {
        code: 'malformed_request',
        message: 'Snipworth received a message it did not understand.',
      },
    });
  });

  it('should_respond_with_malformed_error_when_payload_is_null', async () => {
    const { response } = await dispatchMessage(null);
    expect(response).toEqual({
      ok: false,
      error: {
        code: 'malformed_request',
        message: 'Snipworth received a message it did not understand.',
      },
    });
  });

  it('should_respond_with_malformed_error_when_message_only_inherits_a_type_field', async () => {
    const obj = Object.create({ type: 'PING' }) as object;
    const { response } = await dispatchMessage(obj);
    expect(response).toEqual({
      ok: false,
      error: {
        code: 'malformed_request',
        message: 'Snipworth received a message it did not understand.',
      },
    });
  });

  it('should_respond_with_malformed_error_when_LOAD_CODE_arrives_at_the_background', async () => {
    const { response } = await dispatchMessage({ type: 'LOAD_CODE', code: 'const x = 1;' });
    expect(response).toEqual({
      ok: false,
      error: {
        code: 'malformed_request',
        message: 'Snipworth received a message it did not understand.',
      },
    });
  });

  it('should_reject_message_when_sender_id_does_not_match_extension_id', async () => {
    const { response } = await dispatchMessage(
      { type: 'PING' },
      { id: 'a-different-extension-id' },
    );
    expect(response).toEqual({
      ok: false,
      error: {
        code: 'unauthorized_sender',
        message: 'Snipworth rejected a message from an unauthorized sender.',
      },
    });
  });

  it('should_persist_a_pending_error_when_message_is_malformed', async () => {
    await dispatchMessage({ type: 'UNKNOWN' });

    await vi.waitFor(async () => {
      const stored = await chrome.storage.local.get(['pending_errors']);
      expect(stored.pending_errors).toMatchObject([{ kind: 'invalid_message' }]);
    });
  });

  it('should_show_action_badge_when_a_malformed_message_is_received', async () => {
    await dispatchMessage({ type: 'UNKNOWN' });

    await vi.waitFor(() => {
      expect(readBadge().text).toBe('!');
    });
  });

  it('should_not_persist_a_pending_error_when_sender_is_unauthorized', async () => {
    await dispatchMessage({ type: 'PING' }, { id: 'a-different-extension-id' });

    await Promise.resolve();
    const stored = await chrome.storage.local.get(['pending_errors']);
    expect(stored.pending_errors).toBeUndefined();
  });

  it('should_log_a_dropped_report_to_console_when_error_reporter_fails_after_a_malformed_message', async () => {
    queueStorageFault({ area: 'local', op: 'set', cause: new Error('quota exceeded') });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const { response } = await dispatchMessage({ type: 'UNKNOWN' });

    expect(response).toEqual({
      ok: false,
      error: {
        code: 'malformed_request',
        message: 'Snipworth received a message it did not understand.',
      },
    });
    await vi.waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        '[snipworth] error reporter failed; report dropped',
        expect.objectContaining({
          report: expect.objectContaining({ kind: 'invalid_message' }) as unknown,
          cause: expect.any(Error) as unknown,
        }) as unknown,
      );
    });
    consoleError.mockRestore();
  });
});

describe('service worker — onInstalled', () => {
  it('should_request_side_panel_to_open_on_action_click', async () => {
    dispatchInstalled();

    await vi.waitFor(() => {
      expect(readBehavior()).toEqual({ openPanelOnActionClick: true });
    });
  });

  it('should_install_the_capture_context_menu', async () => {
    dispatchInstalled();

    await vi.waitFor(() => {
      const menus = readCreatedMenus();
      expect(menus).toHaveLength(1);
      expect(menus[0]?.id).toBe(CAPTURE_MENU_ID);
      expect(menus[0]?.properties.contexts).toEqual(['selection']);
    });
  });

  it('should_persist_a_pending_error_when_set_panel_behavior_rejects_with_an_Error', async () => {
    queueSidePanelFault({ op: 'setPanelBehavior', cause: new Error('boom') });
    dispatchInstalled();

    await vi.waitFor(async () => {
      const stored = await chrome.storage.local.get(['pending_errors']);
      expect(stored.pending_errors).toMatchObject([
        { kind: 'side_panel_setup_failed', source: 'background', details: 'boom' },
      ]);
    });
  });

  it('should_show_action_badge_when_set_panel_behavior_rejects', async () => {
    queueSidePanelFault({ op: 'setPanelBehavior', cause: new Error('boom') });
    dispatchInstalled();

    await vi.waitFor(() => {
      expect(readBadge().text).toBe('!');
    });
  });

  it('should_replace_corrupt_storage_with_a_marker_at_install', async () => {
    await chrome.storage.local.set({ pending_errors: 'not an array' });

    dispatchInstalled();

    await vi.waitFor(async () => {
      const stored = await chrome.storage.local.get(['pending_errors']);
      expect(stored.pending_errors).toMatchObject([{ kind: 'error_inbox_corrupt' }]);
    });
  });
});

describe('service worker — onStartup', () => {
  it('should_replace_corrupt_storage_with_a_marker_at_startup', async () => {
    await chrome.storage.local.set({ pending_errors: 'not an array' });

    dispatchStartup();

    await vi.waitFor(async () => {
      const stored = await chrome.storage.local.get(['pending_errors']);
      expect(stored.pending_errors).toMatchObject([{ kind: 'error_inbox_corrupt' }]);
    });
  });

  it('should_keep_storage_unchanged_when_inbox_is_already_consistent_at_startup', async () => {
    dispatchStartup();

    await Promise.resolve();
    const stored = await chrome.storage.local.get(['pending_errors']);
    expect(stored.pending_errors).toBeUndefined();
  });
});

describe('service worker — context menu capture', () => {
  it('should_write_the_pending_capture_to_session_storage_when_the_capture_menu_is_clicked', async () => {
    dispatchContextMenuClick(
      {
        menuItemId: CAPTURE_MENU_ID,
        editable: false,
        selectionText: 'const x = 1;',
        pageUrl: 'https://example.com/page',
      },
      { id: 11 } as chrome.tabs.Tab,
    );

    await vi.waitFor(() => {
      expect(readSession(PENDING_CAPTURE_KEY)).toEqual({
        code: 'const x = 1;',
        sourceUrl: 'https://example.com/page',
      });
    });
  });

  it('should_open_the_side_panel_for_the_clicked_tab_when_the_capture_menu_is_clicked', async () => {
    dispatchContextMenuClick(
      {
        menuItemId: CAPTURE_MENU_ID,
        editable: false,
        selectionText: 'a',
      },
      { id: 42 } as chrome.tabs.Tab,
    );

    await vi.waitFor(() => {
      expect(readSidePanelOpens()).toEqual([{ tabId: 42 }]);
    });
  });

  it('should_persist_a_pending_error_when_storage_set_for_the_capture_fails', async () => {
    queueStorageFault({ area: 'session', op: 'set', cause: new Error('quota exceeded') });

    dispatchContextMenuClick(
      {
        menuItemId: CAPTURE_MENU_ID,
        editable: false,
        selectionText: 'a',
      },
      { id: 1 } as chrome.tabs.Tab,
    );

    await vi.waitFor(async () => {
      const stored = await chrome.storage.local.get(['pending_errors']);
      expect(stored.pending_errors).toMatchObject([
        { kind: 'capture_storage_failed', source: 'background', details: 'quota exceeded' },
      ]);
    });
  });

  it('should_persist_a_pending_error_when_opening_the_side_panel_fails', async () => {
    queueSidePanelFault({ op: 'open', cause: new Error('no such tab') });

    dispatchContextMenuClick(
      {
        menuItemId: CAPTURE_MENU_ID,
        editable: false,
        selectionText: 'a',
      },
      { id: 1 } as chrome.tabs.Tab,
    );

    await vi.waitFor(async () => {
      const stored = await chrome.storage.local.get(['pending_errors']);
      expect(stored.pending_errors).toMatchObject([
        { kind: 'capture_panel_open_failed', source: 'background', details: 'no such tab' },
      ]);
    });
  });
});
