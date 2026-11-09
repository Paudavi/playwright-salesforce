# Playwright + Salesforce test framework

End-to-end and API tests for a Salesforce org: Lightning UI with Playwright,
test data and verification through the Salesforce REST API, and CI on GitHub Actions.

## What it covers
- Lightning UI: Accounts and a custom Backup Job object (picklists, lookups, modals)
- API: data setup, SOQL verification and negative cases
- Metadata: deployed fields compared against their source XML
- Async flows: polling a job until it reaches its final status

## Structure
- `global-setup.ts`: logs in once through the Salesforce CLI and saves the session
- `fixtures.ts`: gives tests an API client and page objects; cleans up created records
- `api/`: Salesforce REST client (query, describe, create, update, delete, cleanup)
- `pages/`: page objects for Lightning screens
- `tests/`: specs; critical ones are tagged `@smoke`
- `salesforce/`: metadata source (objects, fields, permission sets)

## Run locally
1. Install Node 22 and the Salesforce CLI
2. `sf org login web --alias flosum-prep`
3. Copy `.env.example` to `.env` and set your org URL
4. `npm ci` and `npx playwright install chromium`
5. `npm test` (all) or `npm run test:smoke`

## Authentication
No credentials are stored in the repo. Locally, tests get a fresh access token
from the Salesforce CLI at runtime. In CI, the `SFDX_AUTH_URL` secret logs in the CLI.

## CI
GitHub Actions runs a type check, smoke tests on pull requests and the full
suite nightly. The HTML report is uploaded as an artifact.