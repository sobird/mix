import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
    // Playwright 用例由 `test:e2e` 运行，不能被 Vitest 收集
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
});
