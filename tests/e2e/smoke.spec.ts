import { test, expect } from './fixtures/loadExtension';

test('extension loads, service worker boots, and side panel renders onboarding', async ({
  context,
  extensionId,
}) => {
  expect(context.serviceWorkers().length).toBeGreaterThanOrEqual(1);

  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/src/adapters/primary/sidepanel/index.html`);

  await expect(page.getByText('Welcome to Snipworth')).toBeVisible();
});
