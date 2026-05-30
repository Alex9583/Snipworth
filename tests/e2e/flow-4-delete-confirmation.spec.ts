import { test, expect } from './fixtures/loadExtension';
import { completeOnboarding } from './helpers/completeOnboarding';
import { createDraftViaUi } from './helpers/createDraftViaUi';
import { openFullTab } from './helpers/openFullTab';
import { openSidePanel } from './helpers/openSidePanel';

test.describe('Flow 4: Delete with confirmation modal', () => {
  test('should_require_confirmation_to_delete_and_persist_deletion_across_reload', async ({
    context,
    extensionId,
  }) => {
    const sidePanelPage = await openSidePanel(context, extensionId);
    await completeOnboarding(sidePanelPage);

    const page = await openFullTab(context, extensionId);

    await createDraftViaUi(page, { code: 'const b = 2;', language: 'javascript' });
    await page.getByRole('tab', { name: 'Library' }).click();
    await expect(page.getByRole('article')).toHaveCount(1);

    await page.getByRole('button', { name: 'More' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Delete this draft?')).toBeVisible();

    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('article')).toHaveCount(1);

    await page.getByRole('button', { name: 'More' }).click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('article')).toHaveCount(0);

    await page.reload();
    await page.getByRole('tab', { name: 'Library' }).click();
    await expect(page.getByRole('article')).toHaveCount(0);
  });
});
