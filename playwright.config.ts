import { defineConfig, devices } from '@playwright/test'
import { existsSync } from 'node:fs'

// Some sandboxed dev environments (like the one this project was built in)
// pre-fetch a single Chromium binary instead of Playwright's usual
// headless-shell download and can't reach the network to fetch another one.
// If that binary is present, use it; otherwise fall back to Playwright's
// normal browser management (the right behavior on a real machine or CI).
const sandboxChromium = '/opt/pw-browsers/chromium'
const chromiumExecutablePath = existsSync(sandboxChromium) ? sandboxChromium : undefined

// End-to-end tests, run against a real built-and-served copy of the site in
// a real browser — a different layer from the Vitest/jsdom unit tests, which
// exercise components in isolation and never load an actual page, click a
// real download, or run the real service worker registration path.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: chromiumExecutablePath ? { executablePath: chromiumExecutablePath } : {},
      },
    },
  ],
})
