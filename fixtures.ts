import { test as base } from '@playwright/test';
import { SalesforceApi } from './api/salesforce-api';
import { AccountsPage } from './pages/account-page';
import { BackupJobsPage } from './pages/backup-jobs-page';

type Fixtures = {
    sfApi: SalesforceApi;
    accountsPage: AccountsPage;
    backupJobsPage: BackupJobsPage;
};

export const test = base.extend<Fixtures>({
    // API client: created before the test, records deleted after it
    sfApi: async ({ }, use) => {
        const sf = await SalesforceApi.connect();
        await use(sf);          // the test runs here
        await sf.cleanup();     // runs after the test, even if it failed
        await sf.dispose();
    },

    // Page objects, ready to use
    accountsPage: async ({ page }, use) => {
        await use(new AccountsPage(page));
    },
    backupJobsPage: async ({ page }, use) => {
        await use(new BackupJobsPage(page));
    },
});

export { expect } from '@playwright/test';