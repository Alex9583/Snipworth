import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  installChromeMock,
  queueTabsCreateFault,
  readCreatedTabs,
  resetChromeMock,
} from '../../../setup/chrome-mock';
import { ChromeTabOpener } from '@/adapters/secondary/tab/ChromeTabOpener';

describe('ChromeTabOpener', () => {
  beforeEach(() => {
    installChromeMock();
  });

  afterEach(() => {
    resetChromeMock();
  });

  it('should_open_a_tab_pointing_to_the_full_tab_html_and_return_opened_when_chrome_resolves', async () => {
    const opener = new ChromeTabOpener();

    const outcome = await opener.openFullTab();

    expect(outcome).toEqual({ kind: 'opened' });
    expect(readCreatedTabs()).toEqual([
      { url: 'chrome-extension://test/src/adapters/primary/tab/index.html' },
    ]);
  });

  it('should_return_open_failed_carrying_the_cause_when_chrome_rejects', async () => {
    const cause = new Error('tabs.create rejected by user permission');
    queueTabsCreateFault({ op: 'create', cause });
    const opener = new ChromeTabOpener();

    const outcome = await opener.openFullTab();

    expect(outcome).toEqual({ kind: 'open_failed', cause });
  });
});
