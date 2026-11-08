import { request, APIRequestContext } from '@playwright/test';
import { execSync } from 'node:child_process';

export const ORG = process.env.SF_ORG_ALIAS || 'flosum-prep';

// ---------- sf CLI helpers ----------

// Runs an sf CLI command and returns its parsed "result"
export function runSf(command: string) {
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
    const org = runSf(`sf org display --json -o ${ORG}`);

    // The access token is redacted in org display, so it has its own command
    const auth = runSf(`sf org auth show-access-token --json -o ${ORG}`);
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

    // Connect: builds an HTTP client with the base URL and auth header
    static async connect() {
        const org = getOrgInfo();
        const api = await request.newContext({
            baseURL: org.instanceUrl,
            extraHTTPHeaders: { Authorization: `Bearer ${org.accessToken}` },
        });
        return new SalesforceApi(api, org.apiVersion);
    }

    // Read: runs a SOQL query and returns the matching records
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

    // Write: creates a record, remembers it for cleanup, returns its Id
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

    // Registers a record created outside this client (e.g. through the UI) for cleanup
    track(objectName: string, id: string) {
        this.created.push({ objectName, id });
    }

    // Write: updates fields of an existing record
    async update(objectName: string, id: string, fields: Record<string, unknown>) {
        const res = await this.api.patch(
            `/services/data/v${this.version}/sobjects/${objectName}/${id}`,
            { data: fields }
        );
        if (!res.ok()) {
            throw new Error(`Update failed (${res.status()}): ${await res.text()}`);
        }
    }

    // Raw request: return the response as is, for negative tests
    async createRaw(objectName: string, fields: Record<string, unknown>) {
        return this.api.post(`/services/data/v${this.version}/sobjects/${objectName}`,
            { data: fields }
        )
    }

    async getRaw(objectName: string , id:string) {
        return this.api.get(`/services/data/v${this.version}/sobjects/${objectName}/${id}`);
    }



    // Write: deletes a record by Id
    async delete(objectName: string, id: string) {
        const res = await this.api.delete(
            `/services/data/v${this.version}/sobjects/${objectName}/${id}`
        );
        if (!res.ok()) {
            throw new Error(`Delete failed (${res.status()}): ${await res.text()}`);
        }
        this.created = this.created.filter((r) => r.id !== id);
    }

    // Clean up: deletes everything this client created, newest first
    async cleanup() {
        for (const record of this.created.reverse()) {
            await this.delete(record.objectName, record.id);
        }
        this.created = [];
    }

    // Close: releases the HTTP client
    async dispose() {
        await this.api.dispose();
    }
}