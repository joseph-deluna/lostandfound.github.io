import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  use: { baseURL: 'http://127.0.0.1:4173/lostandfound.github.io/', headless: true },
  webServer: { command: 'npm run preview', url: 'http://127.0.0.1:4173/lostandfound.github.io/', reuseExistingServer: !process.env.CI },
  projects: [{ name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } }, { name: 'mobile', use: { viewport: { width: 390, height: 844 } } }]
});
