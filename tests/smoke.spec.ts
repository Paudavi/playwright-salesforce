import { test, expect } from '@playwright/test';

test('Lightning home loads with the saved session', { tag: '@smoke' }, async ({ page }) => {
    await page.goto('/lightning/page/home');
    await expect(page).toHaveTitle(/Home/);
});