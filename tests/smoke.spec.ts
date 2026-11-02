import { test, expect } from '@playwright/test'

test('Salesforce login page loads', async({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Salesforce|Login/);
});