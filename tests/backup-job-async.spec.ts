import { test, expect } from '../fixtures';

test('queued backup job eventually reaches Completed', async ({ sfApi }) => {
    const id = await sfApi.create('Backup_Job__c', { Name: `QA async ${Date.now()}`, Status__c: 'Queued' });

    // Simulates the background worker finishing the job after 5 seconds
    const worker = new Promise<void>((resolve) =>
        setTimeout(() => sfApi.update('Backup_Job__c', id, { Status__c: 'Completed' }).then(resolve), 5_000)
    );

    await expect.poll(async () => {
        const [job] = await sfApi.query(`SELECT Status__c FROM Backup_Job__c WHERE Id = '${id}'`);
        return job.Status__c;
    }, {timeout: 30_000, intervals: [1_000, 2_000, 5_000] }).toBe('Completed');

    await worker;

});