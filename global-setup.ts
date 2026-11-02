import { chromium } from '@playwright/test';
import { execSync } from 'node:child_process';

export default async function globalSetup() {
    // 1. Pedirle al CLI la URL de login, sin colores en la salida
    const raw = execSync('sf org open --url-only --json -o flosum-prep', {
        env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
    }).toString();

    // Por las dudas: borrar códigos de color que hayan quedado y cortar hasta el primer {
    const clean = raw.replace(/\x1b\[[0-9;]*m/g, '');
    const json = JSON.parse(clean.slice(clean.indexOf('{')));

    if (json.status !== 0) {
        throw new Error(`sf CLI failed: ${json.message}`);
    }
    const url = json.result.url;

    // 2. Entrar a Salesforce con esa URL y esperar a Lightning
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForURL(/lightning/);

    // 3. Guardar la sesión para los tests
    await page.context().storageState({ path: '.auth/admin.json' });
    await browser.close();
}