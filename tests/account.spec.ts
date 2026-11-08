import { test, expect } from '../fixtures';

test('create an Account through the UI', { tag: '@smoke' }, async ({ page, accountsPage, sfApi }) => {
    const accountName = `QA Account ${Date.now()}`;

    await accountsPage.goto();
    await accountsPage.create(accountName);

    await expect(page.getByText(/was created/)).toBeVisible();
    await expect(page.getByRole('heading', { name: accountName })).toBeVisible();

    const records = await sfApi.query(`SELECT Id, Name FROM Account WHERE Name = '${accountName}'`);
    expect(records).toHaveLength(1);
    sfApi.track('Account', records[0].Id);
});

test('cannot save an Account without a name', async ({ accountsPage }) => {

    await accountsPage.goto();
    await accountsPage.openNewForm();
    await accountsPage.save();

    await expect(accountsPage.modal.getByText('Complete this field.')).toBeVisible();
    await expect(accountsPage.errorFieldLink).toBeVisible();
    await expect(accountsPage.modal).toBeVisible();
});