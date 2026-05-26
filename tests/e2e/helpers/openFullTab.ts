import type { BrowserContext, Page } from '@playwright/test';

export async function openFullTab(context: BrowserContext, extensionId: string): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/src/adapters/primary/tab/index.html`);
  return page;
}
