import { test, expect } from '../fixtures';

test('a failed backup shows Failed status on its record page', { tag: '@smoke' } ,async ({ page, sfApi }) => {
    const jobName = `QA Job ${Date.now()}`;

    // Arrange: create the data through the API
    const jobId = await sfApi.create('Backup_Job__c', {
        Name: jobName,
        Status__c: 'Failed',
        Records_Backed_Up__c: 0,
    });

    // Act: open the record page directly by Id
    await page.goto(`/lightning/r/Backup_Job__c/${jobId}/view`);

    // Assert: what the UI shows
    await expect(page.getByRole('heading', { name: jobName })).toBeVisible();
    const statusField = page.locator('records-record-layout-item').filter({ hasText: 'Status' });
    await expect(statusField.getByText('Failed', { exact: true })).toBeVisible();
});