import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// 全部测试统一使用内存数据库，避免读写真实的 database.sqlite
// 具体实现见 src/lib/__mocks__/sequelize.ts
vi.mock('@/lib/sequelize');

// jsdom 没有 matchMedia，antd 的响应式组件（Grid/Form 等）依赖它
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }) as unknown as MediaQueryList;
}

// 自动清理DOM
afterEach(() => {
  cleanup();
});
