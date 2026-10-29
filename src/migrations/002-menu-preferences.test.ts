// @vitest-environment node

import { DataTypes } from 'sequelize';

import { runMigrations } from '@/lib/migrator';
import { sequelize } from '@/models';

import { useInMemoryDatabase } from '../../tests/helpers/database';

useInMemoryDatabase();

describe('002-menu-preferences migration', () => {
  // 该 hook 在 `useInMemoryDatabase()` 的 `sync({ force: true })` 之后执行，
  // 把模型表与 `sequelize_meta` 一并清空，确保每个用例都从真正的空库开始。
  beforeEach(async () => {
    await sequelize.drop();
    await sequelize.query('DROP TABLE IF EXISTS sequelize_meta');
  });

  it('upgrades a phase 1 menus table', async () => {
    const queryInterface = sequelize.getQueryInterface();
    await queryInterface.dropTable('menus');
    await queryInterface.createTable('menus', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.INTEGER },
      name: { type: DataTypes.STRING, allowNull: false },
      href: { type: DataTypes.STRING, allowNull: false },
      icon: { type: DataTypes.STRING },
      description: { type: DataTypes.STRING },
      parent_id: { type: DataTypes.INTEGER },
      sort: { type: DataTypes.INTEGER },
      created_at: { type: DataTypes.DATE },
      updated_at: { type: DataTypes.DATE },
      deleted_at: { type: DataTypes.DATE },
    });
    await runMigrations(sequelize);
    const columns = await queryInterface.describeTable('menus');
    expect(columns.permission_id).toBeDefined();
    expect(columns.user_id).toBeUndefined();
    expect(await queryInterface.showAllTables()).toContain('user_menu_preferences');
  });

  it('is a no-op on a freshly synced database', async () => {
    expect(await runMigrations(sequelize)).toEqual(['001-baseline', '002-menu-preferences']);
    expect(await runMigrations(sequelize)).toEqual([]);
  });
});
