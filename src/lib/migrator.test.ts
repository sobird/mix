// @vitest-environment node

import { sequelize } from '@/models';

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { runMigrations } from './migrator';

useInMemoryDatabase();

describe('runMigrations', () => {
  // 该 hook 在 `useInMemoryDatabase()` 的 `sync({ force: true })` 之后执行：
  // `sync` 会建出全部模型表，但 `sequelize_meta` 不是模型，会残留上一次用例的迁移记录。
  // 这里把模型表与 `sequelize_meta` 一并清空，确保每个用例都从真正的空库开始，
  // 从而让测试只能依赖 `baseline.up()` 建表，而不是 beforeEach 的同步结果。
  beforeEach(async () => {
    await sequelize.drop();
    await sequelize.query('DROP TABLE IF EXISTS sequelize_meta');
  });

  it('runs the baseline once', async () => {
    const ran = await runMigrations(sequelize);
    expect(ran).toEqual(['001-baseline', '002-menu-preferences']);
    expect(await runMigrations(sequelize)).toEqual([]);
  });

  it('creates the normalized tables', async () => {
    await runMigrations(sequelize);
    const [columns] = await sequelize.query("PRAGMA table_info('role_permissions')");
    expect(columns.map((c: any) => c.name)).toEqual(expect.arrayContaining(['narrowing', 'expires_at']));
  });
});
