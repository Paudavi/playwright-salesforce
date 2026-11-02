import { Page, Locator } from '@playwright/test';

export class BackupJobsPage {
    readonly page: Page;
    readonly modal: Locator;

    constructor(page: Page) {
        this.page = page;
        this.modal = page.getByRole('dialog', { name: 'New Backup Job' });
    }

    async goto() {
        await this.page.goto('/lightning/o/Backup_Job__c/list?filterName=All');
    }

    async openNewForm() {
        await this.page.getByRole('button', { name: 'New' }).click();
    }

    async fillName(name: string) {
        await this.modal.getByLabel('Backup Job Name').fill(name);
    }

    async selectStatus(status: string) {
        await this.modal.getByRole('combobox', { name: 'Status' }).click();
        await this.page.getByRole('option', { name: status }).click();
    }

    async selectAccount(accountName: string) {
        const lookup = this.modal.getByRole('combobox', { name: 'Account' });
        await lookup.click();
        await lookup.pressSequentially(accountName, { delay: 100 });
        await this.page.getByText(accountName, { exact: true }).click();
    }

    async fillRecordsBackedUp(count: number) {
        await this.modal.getByLabel('Records Backed Up').fill(String(count));
    }

    async save() {
        await this.modal.getByRole('button', { name: 'Save', exact: true }).click();
    }
}