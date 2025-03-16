import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const r = (p: string) => { return resolve(__dirname, p); };

export default defineConfig({
  resolve: {
    // @see https://github.com/vitest-dev/vitest/discussions/3042
    alias: [{ find: '@', replacement: resolve(__dirname, './') }],
  },
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
    alias: {
      '@/': r('./'),
    },
    reporters: 'verbose',
  },
});
