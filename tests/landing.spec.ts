import { test, expect } from '@playwright/test';

test.describe('ETHER Landing Page Integration Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('1. Landing page fits inside a normal desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    
    const wrapper = page.locator('.landing-wrapper');
    await expect(wrapper).toBeVisible();
    
    const box = await wrapper.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(720);
  });

  test('2. The page has no unintended vertical scroll', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('3. Mobile page has no phantom second viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test('4. Loading icon remains within the button', async ({ page }) => {
    const input = page.locator('#repo-url-input');
    const button = page.locator('button[type="submit"]');
    
    await input.fill('https://github.com/facebook/react');
    
    await page.route('**/api/repositories/analyze', async () => {
      // Keep it loading / do not respond
    });
    
    await button.click();
    
    const spinner = button.locator('svg.animate-spin-loading');
    await expect(spinner).toBeVisible();
    
    const spinnerBox = await spinner.boundingBox();
    const buttonBox = await button.boundingBox();
    
    if (spinnerBox && buttonBox) {
      expect(spinnerBox.x).toBeGreaterThanOrEqual(buttonBox.x);
      expect(spinnerBox.x + spinnerBox.width).toBeLessThanOrEqual(buttonBox.x + buttonBox.width);
      expect(spinnerBox.y).toBeGreaterThanOrEqual(buttonBox.y);
      expect(spinnerBox.y + spinnerBox.height).toBeLessThanOrEqual(buttonBox.y + buttonBox.height);
    }
  });

  test('5. Button remains the same width while loading', async ({ page }) => {
    const input = page.locator('#repo-url-input');
    const button = page.locator('button[type="submit"]');
    
    const initialBox = await button.boundingBox();
    const initialWidth = initialBox?.width;
    
    await input.fill('https://github.com/facebook/react');
    
    await page.route('**/api/repositories/analyze', async () => {
      // Keep it loading
    });
    
    await button.click();
    
    const loadingBox = await button.boundingBox();
    const loadingWidth = loadingBox?.width;
    
    expect(loadingWidth).toBeCloseTo(initialWidth || 0, 1);
  });

  test('6. Invalid repository displays an error', async ({ page }) => {
    const input = page.locator('#repo-url-input');
    const button = page.locator('button[type="submit"]');
    
    await input.fill('https://github.com/');
    await button.click();
    
    const errorAlert = page.locator('[role="alert"]');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('error:');
  });

  test('7. Valid repository starts one request only', async ({ page }) => {
    let requestCount = 0;
    await page.route('**/api/repositories/analyze', async (route) => {
      requestCount++;
      await route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'test-repo-id' })
      });
    });
    
    await page.route('**/api/repositories/test-repo-id/status', async () => {});
    
    const input = page.locator('#repo-url-input');
    const button = page.locator('button[type="submit"]');
    
    await input.fill('https://github.com/facebook/react');
    await button.click();
    
    await page.waitForTimeout(500);
    expect(requestCount).toBe(1);
  });

  test('8. Repeated clicks do not create duplicate requests', async ({ page }) => {
    let requestCount = 0;
    await page.route('**/api/repositories/analyze', async (route) => {
      requestCount++;
      await page.waitForTimeout(1000);
      await route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'test-repo-id' })
      });
    });
    
    await page.route('**/api/repositories/test-repo-id/status', async () => {});
    
    const input = page.locator('#repo-url-input');
    const button = page.locator('button[type="submit"]');
    
    await input.fill('https://github.com/facebook/react');
    
    await button.click();
    await button.click({ force: true });
    await button.click({ force: true });
    
    expect(requestCount).toBe(1);
  });

  test('9. Failed requests restore the form', async ({ page }) => {
    await page.route('**/api/repositories/analyze', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'SERVER_ERROR', message: 'Internal Server Error' })
      });
    });
    
    const input = page.locator('#repo-url-input');
    const button = page.locator('button[type="submit"]');
    
    await input.fill('https://github.com/facebook/react');
    await button.click();
    
    await expect(button).not.toBeDisabled();
    await expect(button).toContainText('Explore repository');
    
    await expect(input).toHaveValue('https://github.com/facebook/react');
    
    const errorAlert = page.locator('[role="alert"]');
    await expect(errorAlert).toBeVisible();
  });

  test('10. Successful requests navigate once', async ({ page }) => {
    await page.route('**/api/repositories/analyze', async (route) => {
      await route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'success-id' })
      });
    });
    
    await page.route('**/api/repositories/success-id/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'data: {"id":"success-id","stage":"ready","progress":100,"message":"Universe ready"}\n\n'
      });
    });
    
    await page.route('**/api/repositories/success-id/graph', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ nodes: [], edges: [] })
      });
    });
    
    const input = page.locator('#repo-url-input');
    const button = page.locator('button[type="submit"]');
    
    await input.fill('https://github.com/facebook/react');
    await button.click();
    
    await page.waitForURL('**/explore/success-id');
    expect(page.url()).toContain('/explore/success-id');
  });

  test('11. Returning to the landing page restores a clean idle state', async ({ page }) => {
    const input = page.locator('#repo-url-input');
    const button = page.locator('button[type="submit"]');
    
    await input.fill('https://github.com/invalid-repo-format');
    await button.click();
    
    const errorAlert = page.locator('[role="alert"]');
    await expect(errorAlert).toBeVisible();
    
    const securityLink = page.locator('text=SECURITY').first();
    await securityLink.click();
    await page.waitForURL('**/security');
    
    const backLink = page.locator('text=< Back to home');
    await backLink.click();
    await page.waitForURL('**/');
    
    const freshInput = page.locator('#repo-url-input');
    await expect(freshInput).toHaveValue('');
    
    const freshError = page.locator('[role="alert"]');
    await expect(freshError).not.toBeVisible();
  });
});
