import { test, expect } from './fixtures/loadExtension';
import { completeOnboarding } from './helpers/completeOnboarding';
import { openSidePanel } from './helpers/openSidePanel';

test.describe('Flow 1: Save from side panel → toast → Open full tab → see in Library', () => {
  test('should_save_from_side_panel_show_toast_open_full_tab_and_display_draft_in_library', async ({
    context,
    extensionId,
  }) => {
    const sidePanelPage = await openSidePanel(context, extensionId);
    await completeOnboarding(sidePanelPage);

    await sidePanelPage
      .getByLabel('Code')
      .fill('const greeting = "hello";\nconsole.log(greeting);');
    await sidePanelPage.getByLabel('Language').selectOption('typescript');
    await sidePanelPage.getByRole('button', { name: /Save draft/ }).click();

    const toast = sidePanelPage.getByRole('status');
    await expect(toast).toBeVisible();
    await expect(toast.getByText('Saved to Drafts')).toBeVisible();

    const fullTabPromise = context.waitForEvent('page');
    await toast.getByRole('button', { name: 'Open' }).click();
    const fullTabPage = await fullTabPromise;
    await fullTabPage.waitForLoadState();

    expect(fullTabPage.url()).toContain(`chrome-extension://${extensionId}`);

    await fullTabPage.getByRole('tab', { name: 'Library' }).click();

    const card = fullTabPage.getByRole('article');
    await expect(card).toHaveCount(1);
    await expect(card.locator('h3')).toHaveText('const greeting = "hello";');
    await expect(card.getByText('typescript')).toBeVisible();
    await expect(card.getByText(/Updated/)).toBeVisible();
  });
});
