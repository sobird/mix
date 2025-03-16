import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// 自动清理DOM
afterEach(() => {
  cleanup();
});
