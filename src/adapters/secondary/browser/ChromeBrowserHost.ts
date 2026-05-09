import type {
  BrowserHost,
  CaptureRequestedHandler,
  ConfigureSidePanelOutcome,
  HostCrashReporter,
  InstallContextMenuOutcome,
  LifecycleHandler,
  RuntimeMessageHandler,
} from '@/application/ports/BrowserHost';

export const CAPTURE_MENU_ID = 'snipworth-capture';
export const CAPTURE_MENU_TITLE = 'Snipworth this code';

export class ChromeBrowserHost implements BrowserHost {
  constructor(private readonly onCrash: HostCrashReporter) {}

  get selfId(): string {
    return chrome.runtime.id;
  }

  onInstalled(handler: LifecycleHandler): void {
    chrome.runtime.onInstalled.addListener(() => {
      void handler();
    });
  }

  onStartup(handler: LifecycleHandler): void {
    chrome.runtime.onStartup.addListener(() => {
      void handler();
    });
  }

  onMessage(handler: RuntimeMessageHandler): void {
    chrome.runtime.onMessage.addListener((rawMessage: unknown, sender, sendResponse) => {
      handler({ raw: rawMessage, senderId: sender.id })
        .then((result) => {
          sendResponse(result.response);
        })
        .catch((cause: unknown) => {
          this.onCrash(cause);
          sendResponse({
            ok: false,
            error: {
              code: 'handler_crashed',
              message: 'Snipworth message handler crashed.',
            },
          });
        });
      return true;
    });
  }

  async enableSidePanelOnActionClick(): Promise<ConfigureSidePanelOutcome> {
    try {
      await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
      return { kind: 'configured' };
    } catch (cause) {
      return { kind: 'failed', cause };
    }
  }

  installCaptureContextMenu(): Promise<InstallContextMenuOutcome> {
    return new Promise((resolve) => {
      try {
        chrome.contextMenus.create(
          {
            id: CAPTURE_MENU_ID,
            title: CAPTURE_MENU_TITLE,
            contexts: ['selection'],
          },
          () => {
            const lastError = chrome.runtime.lastError;
            if (lastError !== undefined) {
              resolve({ kind: 'failed', cause: new Error(lastError.message ?? 'unknown') });
              return;
            }
            resolve({ kind: 'installed' });
          },
        );
      } catch (cause) {
        resolve({ kind: 'failed', cause });
      }
    });
  }

  onCaptureRequested(handler: CaptureRequestedHandler): void {
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (info.menuItemId !== CAPTURE_MENU_ID) return;
      const code = info.selectionText;
      const tabId = tab?.id;
      if (code === undefined || code.length === 0 || tabId === undefined) return;
      Promise.resolve(handler({ code, sourceUrl: info.pageUrl, tabId })).catch((cause: unknown) => {
        this.onCrash(cause);
      });
    });
  }
}
