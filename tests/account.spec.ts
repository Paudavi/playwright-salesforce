import { test, expect } from '@playwright/test';
import { AccountsPage } from '../pages/account-page';
import { SalesforceApi } from '../api/salesforce-api';

test('create an Account through the UI',{ tag: '@smoke' }, async ({ page }) => {
    const accountName = `QA Account ${Date.now()}`;
    const accounts = new AccountsPage(page);

    await accounts.goto(); 
    await accounts.create(accountName);

    await expect(page.getByText(/was created/)).toBeVisible();
    await expect(page.getByRole('heading', { name: accountName })).toBeVisible();

    const sf = await SalesforceApi.connect();
    const records = await sf.query(`SELECT Id, Name FROM Account WHERE Name = '${accountName}'`);
    await sf.dispose();

    expect(records).toHaveLength(1);
    expect(records[0].Name).toBe(accountName);
});

test('cannot save an Account without a name', async ({ page }) => {
    const accounts = new AccountsPage(page);

    await accounts.goto();
    await accounts.openNewForm();
    await accounts.save();

    await expect(accounts.modal.getByText('Complete this field.')).toBeVisible();
    await expect(accounts.errorFieldLink).toBeVisible();
    await expect(accounts.modal).toBeVisible();
});