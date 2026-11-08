import { test, expect } from '../fixtures';

const invalidCreates = [
    { name: 'unknown field', fields: { Colour__c: 'red' }, code: 'INVALID_FIELD' },
    { name: 'value outside the restricted picklist', fields: { Status__c: 'Pending' }, code: 'INVALID_OR_NULL_FOR_RESTRICTED_PICKLIST' },
    { name: 'a negative record count', fields: { Records_Backed_Up__c: -5 }, code: 'FIELD_CUSTOM_VALIDATION_EXCEPTION' },
];

for (const c of invalidCreates) {
    test(`Create rejects ${c.name}`, async ({ sfApi }) => {
        const res = await sfApi.createRaw('Backup_Job__c', {
            Name: `QA ${Date.now()}`,
            Status__c: 'Queued',
            ...c.fields
        });

        expect(res.status()).toBe(400);
        const [error] = await res.json();
        expect(error.errorCode).toBe(c.code);
    });
}

test('deleted record returns 404', async ({ sfApi }) => {
    const id = await sfApi.create('Backup_Job__c', {
        Name: `QA to delete ${Date.now()}`,
        Status__c: 'Queued',
    });
    await sfApi.delete('Backup_Job__c', id);

    const res = await sfApi.getRaw('Backup_Job__c', id);
    expect(res.status()).toBe(404);
    const [error] = await res.json();
    expect(error.errorCode).toBe('NOT_FOUND');
});