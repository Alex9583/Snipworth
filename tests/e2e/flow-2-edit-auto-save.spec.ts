import { test, expect } from './fixtures/loadExtension';
import { completeOnboarding } from './helpers/completeOnboarding';
import { createDraftViaUi } from './helpers/createDraftViaUi';
import { openFullTab } from './helpers/openFullTab';
import { openSidePanel } from './helpers/openSidePanel';

test.describe('Flow 2: Open a draft → edit → auto-save → Library reflects changes', () => {
  test('should_auto_save_caption_edit_and_reflect_in_library_when_user_returns', async ({
    context,
    extensionId,
  }) => {
    const sidePanelPage = await openSidePanel(context, extensionId);
    await completeOnboarding(sidePanelPage);

    const page = await openFullTab(context, extensionId);

    await createDraftViaUi(page, { code: 'const x = 1;', language: 'javascript' });

    await page.getByRole('textbox', { name: 'Caption' }).fill('Old caption');
    // Auto-save debounce is 500ms; IndexedDB write is <5ms so "Saving…" is unobservable.
    await page.waitForTimeout(700);

    await page.getByRole('tab', { name: 'Library' }).click();
    await page.getByRole('article').getByRole('heading', { name: 'const x = 1;' }).click();

    await page.getByRole('textbox', { name: 'Caption' }).fill('Updated caption');
    await page.waitForTimeout(700);
    await expect(page.getByRole('button', { name: /Saved/ })).toBeVisible();

    await page.getByRole('tab', { name: 'Library' }).click();
    await expect(page.getByRole('article').getByText(/Updated/)).toBeVisible();

    await page.getByRole('article').getByRole('heading', { name: 'const x = 1;' }).click();
    await expect(page.getByRole('textbox', { name: 'Caption' })).toHaveValue('Updated caption');
  });
});
