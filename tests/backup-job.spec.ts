import { test, expect } from '../fixtures';

test('create a Backup Job with status and account', async ({ page, backupJobsPage, sfApi }) => {
    const accountName = `QA Parent ${Date.now()}`;
    await sfApi.create('Account', { Name: accountName });
    const jobName = `QA Job ${Date.now()}`;


    await backupJobsPage.goto();
    await backupJobsPage.openNewForm();
    await backupJobsPage.fillName(jobName);
    await backupJobsPage.selectStatus('Queued');
    await backupJobsPage.selectAccount(accountName);
    await backupJobsPage.fillRecordsBackedUp(1500);
    await backupJobsPage.save();

    await expect(page.getByText(/was created/)).toBeVisible();
    await expect(page.getByRole('heading', { name: jobName })).toBeVisible();

    const [job] = await sfApi.query(`SELECT Id FROM Backup_Job__c WHERE Name = '${jobName}'`)
    sfApi.track('Backup_Job__c', job.Id);
});