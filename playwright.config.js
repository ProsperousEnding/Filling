import { defineConfig, devices } from '@playwright/test'

const origin = 'http://127.0.0.1:4173'
const rawBasePath = String(process.env.PLAYWRIGHT_BASE_PATH || '/').trim()
const basePath = rawBasePath === '/'
  ? '/'
  : `/${rawBasePath.replace(/^\/+|\/+$/gu, '')}/`
const baseURL = `${origin}${basePath}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}',
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],
  webServer: {
    command: 'pnpm build && pnpm exec vite preview --host 127.0.0.1 --port 4173',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000
  }
})
