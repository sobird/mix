import { afterAll, beforeEach } from 'vitest';

import { sequelize } from '@/lib/sequelize';

/**
 * 让当前测试文件使用独立的内存数据库。
 *
 * 数据库实例由 `tests/setup.ts` 中的 `vi.mock('@/lib/sequelize')` 替换为内存库，
 * 这里只负责在每个用例前重建全部表，保证用例之间互不干扰。
 */
export function useInMemoryDatabase() {
  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });
}
