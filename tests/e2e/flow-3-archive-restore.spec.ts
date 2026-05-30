import { test, expect } from './fixtures/loadExtension';
import { completeOnboarding } from './helpers/completeOnboarding';
import { createDraftViaUi } from './helpers/createDraftViaUi';
import { openFullTab } from './helpers/openFullTab';
import { openSidePanel } from './helpers/openSidePanel';

test.describe('Flow 3: Archive → show archived → Restore', () => {
  test('should_archive_draft_then_restore_it_via_status_filter', async ({
    context,
    extensionId,
  }) => {
    const sidePanelPage = await openSidePanel(context, extensionId);
    await completeOnboarding(sidePanelPage);

    const page = await openFullTab(context, extensionId);

    await createDraftViaUi(page, { code: 'const a = 1;', language: 'javascript' });
    await page.getByRole('tab', { name: 'Library' }).click();
    await expect(page.getByRole('article')).toHaveCount(1);

    await page.getByRole('button', { name: 'More' }).click();
    await page.getByRole('menuitem', { name: 'Archive' }).click();
    await expect(page.getByRole('article')).toHaveCount(0);

    await page.getByRole('button', { name: 'Status' }).click();
    await page.getByRole('menuitem', { name: 'Archived' }).click();
    await expect(page.locator('article[data-status="archived"]')).toHaveCount(1);

    await page.getByRole('button', { name: 'More' }).click();
    await page.getByRole('menuitem', { name: 'Restore' }).click();

    await page.getByRole('button', { name: 'Clear Status filter' }).click();
    await expect(page.locator('article[data-status="draft"]')).toHaveCount(1);
  });
});
