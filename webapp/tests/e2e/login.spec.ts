import { test, expect } from '@playwright/test';

test('login flow with dummyauth redirects and creates session', async ({ page }) => {
  const username = `e2e_user@example.com`;

  // Instrument page to capture console, failed requests and responses for debugging
  page.on('console', msg => console.log('[browser console]', msg.type(), msg.text()));
  page.on('requestfailed', req => console.log('[request failed]', req.url(), req.failure()?.errorText));
  page.on('response', res => console.log('[response]', res.status(), res.url()));

  // Start at the app login route
  await page.goto('/auth/login');

  // Should be redirected to the Dummy Auth login page
  await expect(page.locator('text=Dummy Authentication')).toBeVisible({ timeout: 5000 });

  // Fill credentials and submit
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', 'password');
  await page.click('button.login');

  // After successful login, wait for navigation back to the app
  await page.waitForLoadState('networkidle');
  try {
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 });
  } catch (e) {
    // navigation might already have happened; continue
  }

  // Debug: log current URL and a snippet of the page for diagnosis
  console.log('URL after login:', page.url());
  const snippet = (await page.content()).slice(0, 2000);
  console.log('Page snippet after login:', snippet);

  // Allow some time for the app to fetch /api/me and render user info
  // Use .first() to avoid strict mode errors if the username appears in multiple places
  await expect(page.locator(`text=${username}`).first()).toBeVisible({ timeout: 10000 });
});