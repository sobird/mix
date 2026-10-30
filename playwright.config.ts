import { defineConfig } from '@playwright/test';

/** 与 webServer 中启动的服务保持一致 */
const BASE_URL = 'http://127.0.0.1:3100';

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'bun scripts/e2e-seed.ts && bunx next dev -p 3100',
    url: `${BASE_URL}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DB_STORAGE: './.e2e/database.sqlite',
      NEXT_DIST_DIR: '.next-e2e',
      AUTH_SECRET: 'e2e-secret-e2e-secret-e2e-secret-32',
      NEXTAUTH_URL: BASE_URL,
      LOG_LEVEL: 'error',
    },
  },
});
