/**
 * e2e: MAIA-2 "Subscale data incomplete" warning on the Progress tab
 *
 * Seeds exactly one MAIA-2 assessment with NULL subscale_scores for a fresh
 * user, then navigates to the Progress tab and asserts:
 *   - "Subscale data incomplete" warning is visible
 *   - "Share with Clinician" button is present but disabled
 *   - "Retake Assessment" CTA is present and navigates to /assessment/maia2
 *
 * Run:
 *   npx playwright test e2e/maia2-incomplete-warning.spec.ts
 *
 * Prerequisites:
 *   - Backend running on http://localhost:5000
 *   - DATABASE_URL env var set (same as the backend)
 */

import { test, expect, type Page } from '@playwright/test';
import { Client } from 'pg';

const BASE = 'http://localhost:5000';
const APP = `${BASE}/app`;

const TEST_EMAIL = `maia2-e2e-${Date.now()}@test.interosense.dev`;
const TEST_PASS = 'TestPass123!';
const TEST_NAME = 'MAIA E2E User';

async function registerUser(): Promise<void> {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASS, name: TEST_NAME }),
  });
  if (!res.ok) {
    throw new Error(`Registration failed: ${res.status} ${await res.text()}`);
  }
}

async function seedIncompleteMaia2(): Promise<void> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query(
      `INSERT INTO assessments (user_id, scale_id, scale_name, completed_at, total_score, severity, answers, subscale_scores)
       SELECT id, 'maia2', 'MAIA-2', $1, 85, 'moderate', '[]'::jsonb, NULL
       FROM users WHERE email = $2`,
      [new Date().toISOString(), TEST_EMAIL],
    );
  } finally {
    await client.end();
  }
}

async function loginInBrowser(page: Page): Promise<void> {
  await page.goto(APP, { waitUntil: 'networkidle' });

  const welcomeSignIn = page.getByRole('link', { name: /sign in|log in|already have/i });
  if (await welcomeSignIn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await welcomeSignIn.click();
  }

  await page.waitForURL(/\/auth\/login/, { timeout: 10_000 });

  await page.getByPlaceholder(/email/i).fill(TEST_EMAIL);
  await page.getByPlaceholder(/password/i).fill(TEST_PASS);
  await page.getByRole('button', { name: /sign in|log in/i }).click();

  await page.waitForURL(/\/app(?!\/auth)/, { timeout: 10_000 });
}

async function navigateToProgress(page: Page): Promise<void> {
  const progressTab = page.getByRole('link', { name: /progress/i });
  await progressTab.click();
  await page.waitForTimeout(1000);
}

test.describe('MAIA-2 incomplete subscale warning', () => {
  test.beforeAll(async () => {
    await registerUser();
    await seedIncompleteMaia2();
  });

  test('shows "Subscale data incomplete" warning, disabled Share button, and Retake CTA', async ({ page }) => {
    await loginInBrowser(page);
    await navigateToProgress(page);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    await expect(page.getByText('Subscale data incomplete')).toBeVisible({ timeout: 10_000 });

    const shareBtn = page.getByRole('button', { name: /share with clinician/i });
    await expect(shareBtn).toBeVisible();
    await expect(shareBtn).toBeDisabled();

    const retakeBtn = page.getByRole('button', { name: /retake assessment/i });
    await expect(retakeBtn).toBeVisible();
    await retakeBtn.click();

    await expect(page).toHaveURL(/maia2/, { timeout: 8_000 });
  });
});
