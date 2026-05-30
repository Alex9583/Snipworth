import type { Page } from '@playwright/test';

export async function completeOnboarding(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Start using Snipworth' }).click();
}
