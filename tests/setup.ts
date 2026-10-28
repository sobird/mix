import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// 全部测试统一使用内存数据库，避免读写真实的 database.sqlite
// 具体实现见 src/lib/__mocks__/sequelize.ts
vi.mock('@/lib/sequelize');

// 自动清理DOM
afterEach(() => {
  cleanup();
});
