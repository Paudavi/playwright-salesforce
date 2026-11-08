import { chromium } from '@playwright/test';
import { runSf } from './api/salesforce-api';

export default async function globalSetup() {
    // 1. Ask the sf CLI for a frontdoor URL that logs in directly
    const { url } = runSf('sf org open --url-only --json -o flosum-prep');

    // 2. Open Salesforce with that URL and wait for Lightning
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForURL(/lightning/);

    // 3. Save the session so the tests start logged in
    await page.context().storageState({ path: '.auth/admin.json' });
    await browser.close();
}