import { test, expect } from '@playwright/test';

const mockGraphData = {
  nodes: [
    {
      id: 'demo:src/main.tsx',
      label: 'main.tsx',
      type: 'entry',
      folder: 'src',
      language: 'TypeScript',
      size: 500,
      lineCount: 80,
      position: [0, 0, 0],
      centrality: 0.9,
      weight: 2,
      commits: 5,
      lastModified: '2026-06-14',
      isRecent: true,
      hasIssue: false,
      riskLevel: 'low',
      importCount: 1,
      importedByCount: 0,
    },
    {
      id: 'demo:src/components/Button.tsx',
      label: 'Button.tsx',
      type: 'component',
      folder: 'src/components',
      language: 'TypeScript',
      size: 1000,
      lineCount: 150,
      position: [10, 10, 10],
      centrality: 0.6,
      weight: 2,
      commits: 3,
      lastModified: '2026-06-14',
      isRecent: false,
      hasIssue: false,
      riskLevel: 'medium',
      importCount: 1,
      importedByCount: 1,
    },
    {
      id: 'demo:src/utils/math.ts',
      label: 'math.ts',
      type: 'util',
      folder: 'src/utils',
      language: 'TypeScript',
      size: 200,
      lineCount: 25,
      position: [-10, -10, -10],
      centrality: 0.3,
      weight: 1,
      commits: 1,
      lastModified: '2026-06-12',
      isRecent: false,
      hasIssue: false,
      riskLevel: 'low',
      importCount: 0,
      importedByCount: 1,
    }
  ],
  edges: [
    { source: 'demo:src/main.tsx', target: 'demo:src/components/Button.tsx', weight: 1 },
    { source: 'demo:src/components/Button.tsx', target: 'demo:src/utils/math.ts', weight: 1 }
  ],
  repoName: 'ether-test',
  repoOwner: 'test-owner',
  defaultBranch: 'main',
  totalFiles: 3,
  analyzedFiles: 3,
  languages: { 'TypeScript': 3 },
  fetchedAt: Date.now(),
};

test.describe('ETHER 3D Explorer Integration Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Mock the graph endpoint for the demo repository
    await page.route('**/api/repositories/demo/graph', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockGraphData),
      });
    });

    await page.goto('/explore/demo');
  });

  test('1. Sidebar loads and displays folders/constellations correctly', async ({ page }) => {
    // The clusters panel should be open by default
    const clustersHeader = page.locator('text=SYSTEM CLUSTERS');
    await expect(clustersHeader).toBeVisible();

    // Check that folders are shown in the folder buttons list
    const srcFolder = page.locator('button:has-text("src")');
    await expect(srcFolder).toBeVisible();
  });

  test('2. Clicking a constellation expands its folder but does not open the inspector', async ({ page }) => {
    const srcComponentsFolder = page.locator('button:has-text("src/components")');
    await expect(srcComponentsFolder).toBeVisible();

    await srcComponentsFolder.click();

    // Inspector should NOT be open
    const inspectorTitle = page.locator('text=FILE DETAILS');
    await expect(inspectorTitle).not.toBeVisible();

    // File list should show files in that folder
    const fileButton = page.locator('button:has-text("Button.tsx")');
    await expect(fileButton).toBeVisible();
  });

  test('3. Clicking a file button in the file list selects it and opens the inspector', async ({ page }) => {
    const srcComponentsFolder = page.locator('button:has-text("src/components")');
    await srcComponentsFolder.click();

    const fileButton = page.locator('button:has-text("Button.tsx")');
    await fileButton.click();

    // Inspector should open and display the selected file's details
    const inspectorTitle = page.locator('text=FILE DETAILS');
    await expect(inspectorTitle).toBeVisible();

    const inspectorFileName = page.locator('text=Button.tsx');
    await expect(inspectorFileName.first()).toBeVisible();

    const inspectorPathName = page.locator('text=demo:src/components/Button.tsx');
    await expect(inspectorPathName).toBeVisible();
  });

  test('4. Closing the inspector leaves the node selected', async ({ page }) => {
    const srcComponentsFolder = page.locator('button:has-text("src/components")');
    await srcComponentsFolder.click();

    const fileButton = page.locator('button:has-text("Button.tsx")');
    await fileButton.click();

    // Open check
    const inspectorTitle = page.locator('text=FILE DETAILS');
    await expect(inspectorTitle).toBeVisible();

    // Close the inspector
    const closeButton = page.locator('button[aria-label="Hide inspector"]');
    await closeButton.click();

    // Inspector is hidden
    await expect(inspectorTitle).not.toBeVisible();

    // Node is still selected in the sidebar
    await expect(fileButton).toHaveClass(/bg-accent-primary/);
  });

  test('5. Deselecting/Clearing selection clears the highlighted state', async ({ page }) => {
    const srcComponentsFolder = page.locator('button:has-text("src/components")');
    await srcComponentsFolder.click();

    const fileButton = page.locator('button:has-text("Button.tsx")');
    await fileButton.click();

    // Deselect via the "Clear" button in the inspector header
    const clearButton = page.locator('button:has-text("Clear")');
    await clearButton.click();

    // Inspector closes
    const inspectorTitle = page.locator('text=FILE DETAILS');
    await expect(inspectorTitle).not.toBeVisible();

    // Node selection class is cleared in the sidebar
    await expect(fileButton).not.toHaveClass(/bg-accent-primary/);
  });

});
