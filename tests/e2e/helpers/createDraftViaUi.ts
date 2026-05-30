import type { Page } from '@playwright/test';

export async function createDraftViaUi(
  page: Page,
  { code, language }: { code: string; language: string },
): Promise<void> {
  await page.getByRole('textbox', { name: 'Code' }).fill(code);
  await page.getByLabel('Language').selectOption(language);
  await page.getByRole('button', { name: /Save draft/ }).click();
  await page.getByRole('button', { name: /Saved/ }).waitFor();
}
