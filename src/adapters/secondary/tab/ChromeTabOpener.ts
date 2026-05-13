import type { FullTabOpener, OpenFullTabOutcome } from '@/application/ports/FullTabOpener';

export const FULL_TAB_HTML_PATH = 'src/adapters/primary/tab/index.html';

export class ChromeTabOpener implements FullTabOpener {
  async openFullTab(): Promise<OpenFullTabOutcome> {
    try {
      await chrome.tabs.create({ url: chrome.runtime.getURL(FULL_TAB_HTML_PATH) });
      return { kind: 'opened' };
    } catch (cause) {
      return { kind: 'open_failed', cause };
    }
  }
}
