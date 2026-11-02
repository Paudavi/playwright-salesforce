import { Page, Locator, expect } from '@playwright/test';

export class AccountsPage {
    readonly page: Page;
    readonly modal: Locator;
    readonly errorHeading: Locator;
    readonly errorFieldLink: Locator;

    constructor(page: Page) {
        this.page = page;
        this.modal = page.getByRole('dialog', {name: 'New Account'});
        this.errorHeading = page.getByRole('heading', { name: 'We hit a snag.' });
        this.errorFieldLink = page.getByRole('link', { name: 'Account Name' });
    }

    async goto() {
        await this.page.goto('/lightning/o/Account/list');
    }

    async openNewForm() {
        await this.page.getByRole('button', { name: 'New' }).click();
    }

    async fillName(name: string) {
        await this.modal.getByLabel('Account Name').fill(name);
    }

    async save() {
        await this.modal.getByRole('button', { name: 'Save', exact: true }).click();
    }

    async create(name: string) {
        await this.openNewForm();
        await this.fillName(name);
        await this.save();
    }
}