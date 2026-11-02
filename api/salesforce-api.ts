import { request, APIRequestContext } from '@playwright/test';
import { execSync } from 'node:child_process';

// ---------- sf CLI helpers ----------

// Runs an sf CLI command and returns its parsed "result"
function runSf(command: string) {
    const raw = execSync(command, {
        env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
    }).toString();
    const clean = raw.replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, '');
    const json = JSON.parse(clean.slice(clean.indexOf('{')));
    if (json.status !== 0) throw new Error(`sf CLI failed: ${json.message}`);
    return json.result;
}

// Gets the instance URL, API version and access token for the org
function getOrgInfo() {
    const org = runSf('sf org display --json -o flosum-prep');

    // The access token is redacted in org display, so it has its own command
    const auth = runSf('sf org auth show-access-token --json -o flosum-prep');
    const accessToken = auth.accessToken;

    // A real Salesforce access token starts with the Org ID prefix: 00D...
    if (!accessToken || !accessToken.startsWith('00D')) {
        throw new Error('Could not get a valid access token from the sf CLI');
    }

    return {
        instanceUrl: org.instanceUrl as string,
        apiVersion: org.apiVersion as string,
        accessToken: accessToken as string,
    };
}

// ---------- API client ----------

export class SalesforceApi {
    // Records created during the test, so they can be deleted at the end
    private created: { objectName: string; id: string }[] = [];

    constructor(private api: APIRequestContext, private version: string) { }

    // 1. Connect: builds an HTTP client with the base URL and auth header
    static async connect() {
        const org = getOrgInfo();
        const api = await request.newContext({
            baseURL: org.instanceUrl,
            extraHTTPHeaders: { Authorization: `Bearer ${org.accessToken}` },
        });
        return new SalesforceApi(api, org.apiVersion);
    }

    // 2. Read: runs a SOQL query and returns the matching records
    async query(soql: string) {
        const res = await this.api.get(`/services/data/v${this.version}/query`, {
            params: { q: soql },
        });
        if (!res.ok()) {
            throw new Error(`SOQL failed (${res.status()}): ${await res.text()}`);
        }
        const body = await res.json();
        return body.records;
    }

    // 3. Write: creates a record, remembers it for cleanup, returns its Id
    async create(objectName: string, fields: Record<string, unknown>) {
        const res = await this.api.post(
            `/services/data/v${this.version}/sobjects/${objectName}`,
            { data: fields }
        );
        if (!res.ok()) {
            throw new Error(`Create failed (${res.status()}): ${await res.text()}`);
        }
        const id = (await res.json()).id as string;
        this.created.push({ objectName, id });
        return id;
    }

    // 3. Write: deletes a record by Id
    async delete(objectName: string, id: string) {
        const res = await this.api.delete(
            `/services/data/v${this.version}/sobjects/${objectName}/${id}`
        );
        if (!res.ok()) {
            throw new Error(`Delete failed (${res.status()}): ${await res.text()}`);
        }
    }

    // 4. Clean up: deletes everything this client created, newest first
    async cleanup() {
        for (const record of this.created.reverse()) {
            await this.delete(record.objectName, record.id);
        }
        this.created = [];
    }

    // 5. Close: releases the HTTP client
    async dispose() {
        await this.api.dispose();
    }
}