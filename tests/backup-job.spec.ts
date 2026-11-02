import { test, expect } from '@playwright/test';
import { BackupJobsPage } from '../pages/backup-jobs-page';

test('create a Backup Job with status and account', async ({ page }) => {
    const jobName = `QA Job ${Date.now()}`;
    const jobs = new BackupJobsPage(page);

    await jobs.goto();
    await jobs.openNewForm();
    await jobs.fillName(jobName);
    await jobs.selectStatus('Queued');
    await jobs.selectAccount('Acme');
    await jobs.fillRecordsBackedUp(1500);
    await jobs.save();

    await expect(page.getByText(/was created/)).toBeVisible();
    await expect(page.getByRole('heading', { name: jobName })).toBeVisible();
});