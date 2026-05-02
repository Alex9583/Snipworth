import type {
  BrowserHost,
  ConfigureSidePanelOutcome,
  InstalledHandler,
  RuntimeMessageHandler,
} from '@/application/ports/BrowserHost';

export class ChromeBrowserHost implements BrowserHost {
  get selfId(): string {
    return chrome.runtime.id;
  }

  onInstalled(handler: InstalledHandler): void {
    chrome.runtime.onInstalled.addListener(() => {
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
          console.error('[snipworth] browser host handler rejected', cause);
          sendResponse({ ok: false, error: 'handler crashed' });
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
}
