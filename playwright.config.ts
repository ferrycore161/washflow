import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4179',
    ...devices['iPhone 14'],
    browserName: 'chromium',
    locale: 'ru-RU',
    serviceWorkers: 'allow',
  },
  webServer: {
    // проверяем продакшен-сборку: так же, как её получит iPhone
    command: 'npx vite build && npx vite preview --port 4179 --strictPort',
    url: 'http://localhost:4179',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
