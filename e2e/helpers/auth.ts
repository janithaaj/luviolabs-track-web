import { expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/** Load optional e2e/.env into process.env (does not override existing vars). */
function loadOptionalEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) return;
  for (const raw of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadOptionalEnv();

export const credentials = {
  admin: {
    email: process.env.PLAYWRIGHT_ADMIN_EMAIL || 'admin@luvio.com',
    password: process.env.PLAYWRIGHT_ADMIN_PASSWORD || 'admin123',
  },
};

/** Clear persisted auth so each test starts from a clean login. */
export async function clearAuth(page: Page) {
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.removeItem('luvio-track-auth-v3');
    localStorage.clear();
  });
}

export async function loginAs(
  page: Page,
  user: { email: string; password: string }
) {
  await clearAuth(page);
  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

export async function loginAsAdmin(page: Page) {
  await loginAs(page, credentials.admin);
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Good morning/i);
}
