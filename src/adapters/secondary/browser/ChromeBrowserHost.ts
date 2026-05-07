import type {
  BrowserHost,
  ConfigureSidePanelOutcome,
  HostCrashReporter,
  LifecycleHandler,
  RuntimeMessageHandler,
} from '@/application/ports/BrowserHost';

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
}
