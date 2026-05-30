import type { BrowserContext, Page } from '@playwright/test';

export async function openSidePanel(context: BrowserContext, extensionId: string): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/src/adapters/primary/sidepanel/index.html`);
  return page;
}
