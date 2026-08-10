import { test, expect } from '@playwright/test';
import {
  credentials,
  loginAs,
  loginAsAdmin,
  loginAsEmployee,
} from './helpers/auth';

test.describe('Smoke — admin', () => {
  test('admin login lands on dashboard', async ({ page }) => {
    await loginAs(page, credentials.admin);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Good morning/i);
  });

  test('tasks catalog lists and create task appears', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/work/tasks');
    await expect(page.getByRole('heading', { name: 'Tasks', exact: true })).toBeVisible();

    await expect(page.getByText('Common tasks')).toBeVisible();
    await expect(page.getByText('Loading…')).toHaveCount(0, { timeout: 20_000 });

    const taskName = `E2E Task ${Date.now()}`;
    await page.getByRole('button', { name: 'New task' }).click();
    await expect(page.getByRole('heading', { name: 'Add New Task' })).toBeVisible();
    await page.getByLabel('Task Name').fill(taskName);
    await page.getByRole('button', { name: 'Save Task' }).click();

    await expect(page.getByText('Task created.')).toBeVisible();
    await expect(page.getByText(taskName)).toBeVisible();
  });

  test('new project page loads task checkboxes', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/work/projects/new');
    await expect(page.getByRole('heading', { name: 'New project' })).toBeVisible();

    await expect(page.getByText('Loading tasks…')).toHaveCount(0, { timeout: 20_000 });
    await expect(page.getByRole('heading', { name: 'Tasks', exact: true })).toBeVisible();

    const taskChecks = page.locator(
      'div.max-h-72 label:has(span) input[type="checkbox"]'
    );
    await expect(taskChecks.first()).toBeVisible({ timeout: 15_000 });
    expect(await taskChecks.count()).toBeGreaterThan(0);

    // Create project when possible (client select or inline new client)
    const projectName = `E2E Project ${Date.now()}`;
    const clientSelect = page.locator('form select').first();
    const optionCount = await clientSelect.locator('option').count();

    if (optionCount <= 1) {
      await page.getByRole('button', { name: '+ New client' }).click();
      await expect(page.getByRole('heading', { name: 'New client' })).toBeVisible();
      await page.getByLabel('Company name').fill(`E2E Client ${Date.now()}`);
      await page.getByRole('button', { name: 'Save client' }).click();
      await expect(page.getByRole('heading', { name: 'New client' })).toHaveCount(0);
    } else {
      await clientSelect.selectOption({ index: 1 });
    }

    const projectNameInput = page
      .locator('div')
      .filter({ has: page.locator('label', { hasText: /^Project name$/ }) })
      .locator('input')
      .first();
    await projectNameInput.fill(projectName);

    await page.getByRole('button', { name: 'Save project' }).click();
    await expect(page).toHaveURL(/\/work\/projects(?:\?|$)/, { timeout: 20_000 });
    await expect(page.getByText(projectName)).toBeVisible({ timeout: 15_000 });
  });
});

test.describe('Smoke — employee', () => {
  test('employee login loads timesheet', async ({ page }) => {
    await loginAsEmployee(page);
    await expect(page).toHaveURL(/\/timesheet/);
    await expect(page.getByRole('heading', { name: 'Timesheet' })).toBeVisible();
  });
});
