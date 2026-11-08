import { test, expect } from '../fixtures';
import { XMLParser } from 'fast-xml-parser';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';


// Salesforce DX project inside this repo
const SF_PROJECT = join(__dirname, '..', 'salesforce');

// XML and describe use different names for the same field type
const TYPE_MAP: Record<string, string> = {
    Number: 'double',
    Picklist: 'picklist',
    Text: 'string',
    DateTime: 'datetime',
    Lookup: 'reference',
};

// Reads a fields's XML from the repo and returns it as an object
function readFieldXml(objectName: string, fieldName: string) {
    const file = join(
        SF_PROJECT, 'force-app', 'main', 'default', 'objects',
        objectName, 'fields', `${fieldName}.field-meta.xml`
    );
    const parser = new XMLParser({ isArray: (name) => name === 'value' })
    return parser.parse(readFileSync(file, 'utf-8')).CustomField;
}

const numberFields = ['Records_Backed_Up__c'];

for (const fieldName of numberFields) {
    test(`${fieldName} in the org matches its source XML`, { tag: '@smoke' }, async ({ sfApi }) => {
        const source = readFieldXml('Backup_Job__c', fieldName);

        const describe = await sfApi.describe('Backup_Job__c');
        const field = describe.fields.find((f: any) => f.name === source.fullName);

        // Missing here usually means the field exists but nobody has field-level security on it
        expect(field, `${source.fullName} not visible: check field-level security`).toBeDefined();
        expect(field.type).toBe(TYPE_MAP[source.type]);

        expect(field.label).toBe(source.label);
        expect(field.precision).toBe(source.precision);
        expect(field.scale).toBe(source.scale);
    });
}

test('Status__c in the org has exactly the picklist values in its source XML', async ({ sfApi }) => {
    const source = readFieldXml('Backup_Job__c', 'Status__c');
    const expected = source.valueSet.valueSetDefinition.value.map((v: any) => v.fullName);

    const describe = await sfApi.describe('Backup_Job__c');
    const field = describe.fields.find((f: any) => f.name === 'Status__c');
    const actual = field.picklistValues.map((v: any) => v.value);

    expect(field.type).toBe('picklist');
    expect(field.restrictedPicklist).toBe(true);
    expect(actual).toEqual(expected);
});