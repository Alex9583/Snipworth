import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test as base, chromium, type BrowserContext } from '@playwright/test';

const fixtureDir = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION_DIST = path.resolve(fixtureDir, '../../../dist');

interface ExtensionFixtures {
  context: BrowserContext;
  extensionId: string;
}

export const test = base.extend<ExtensionFixtures>({
  // eslint-disable-next-line no-empty-pattern -- Playwright fixture signature
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [`--disable-extensions-except=${EXTENSION_DIST}`, `--load-extension=${EXTENSION_DIST}`],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    const [existing] = context.serviceWorkers();
    const serviceWorker = existing ?? (await context.waitForEvent('serviceworker'));
    const id = serviceWorker.url().split('/')[2];
    if (id === undefined || id.length === 0) {
      throw new Error(
        `Could not parse extension ID from service worker URL: ${serviceWorker.url()}`,
      );
    }
    await use(id);
  },
});

export { expect } from '@playwright/test';
