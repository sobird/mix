// @vitest-environment node

import { DataTypes, QueryTypes } from 'sequelize';

import { runMigrations } from '@/lib/migrator';
import { sequelize } from '@/models';

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { menuPreferences } from './002-menu-preferences';

useInMemoryDatabase();

type ForeignKeyRow = {
  table: string;
  from: string;
  to: string;
  on_update: string;
  on_delete: string;
};

/** 查询 `menus` 的外键定义，用于断言 ON DELETE / ON UPDATE 动作未在重建中丢失。 */
async function menuForeignKeys(): Promise<ForeignKeyRow[]> {
  return (await sequelize.query("PRAGMA foreign_key_list('menus')", {
    type: QueryTypes.SELECT,
  })) as ForeignKeyRow[];
}

/** 读取 `sqlite_master` 中某张表的 CREATE TABLE 语句。 */
async function tableSql(table: string): Promise<string> {
  const rows = (await sequelize.query("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = :table", {
    type: QueryTypes.SELECT,
    replacements: { table },
  })) as { sql: string }[];

  return rows[0]?.sql ?? '';
}

/** 构造 phase 1 形态的 `menus`：`user_id` 与 `parent_id` 都带外键动作。 */
async function createPhase1Menus(): Promise<void> {
  const queryInterface = sequelize.getQueryInterface();
  // 先 sync 出 `users`/`permissions` 等被引用的表，模拟真实的 phase 1 库。
  await sequelize.sync();
  await queryInterface.dropTable('menus');
  await queryInterface.createTable('menus', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: {
      type: DataTypes.INTEGER,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    name: { type: DataTypes.STRING, allowNull: false },
    href: { type: DataTypes.STRING, allowNull: false },
    icon: { type: DataTypes.STRING },
    description: { type: DataTypes.STRING },
    parent_id: {
      type: DataTypes.INTEGER,
      references: { model: 'menus', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    sort: { type: DataTypes.INTEGER },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
    deleted_at: { type: DataTypes.DATE },
  });
}

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

  it('preserves foreign key actions, autoincrement, and rows when upgrading a phase 1 table', async () => {
    await createPhase1Menus();
    await sequelize.query(
      "INSERT INTO `menus` (`id`, `name`, `href`, `created_at`, `updated_at`) VALUES (1, 'Dashboard', '/dashboard', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
    );
    await sequelize.query(
      "INSERT INTO `menus` (`id`, `name`, `href`, `parent_id`, `created_at`, `updated_at`) VALUES (2, 'Reports', '/reports', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
    );

    await runMigrations(sequelize);

    const foreignKeys = await menuForeignKeys();
    const parentKey = foreignKeys.find((foreignKey) => foreignKey.from === 'parent_id');
    expect(parentKey).toMatchObject({
      table: 'menus',
      to: 'id',
      on_delete: 'SET NULL',
      on_update: 'CASCADE',
    });

    const permissionKey = foreignKeys.find((foreignKey) => foreignKey.from === 'permission_id');
    expect(permissionKey).toMatchObject({
      table: 'permissions',
      to: 'id',
      on_delete: 'CASCADE',
      on_update: 'CASCADE',
    });

    expect(await tableSql('menus')).toContain('AUTOINCREMENT');

    const rows = (await sequelize.query('SELECT `id`, `href` FROM `menus` ORDER BY `id`', {
      type: QueryTypes.SELECT,
    })) as { id: number; href: string }[];
    expect(rows).toEqual([
      { id: 1, href: '/dashboard' },
      { id: 2, href: '/reports' },
    ]);

    // 行为断言：删除父菜单应把子菜单的 parent_id 置空，而不是报外键错误。
    await sequelize.query('DELETE FROM `menus` WHERE `id` = 1');
    const children = (await sequelize.query('SELECT `id`, `parent_id` FROM `menus`', {
      type: QueryTypes.SELECT,
    })) as { id: number; parent_id: number | null }[];
    expect(children).toEqual([{ id: 2, parent_id: null }]);
  });

  it('restores the phase 1 foreign keys after up then down', async () => {
    await runMigrations(sequelize);

    await menuPreferences.up({ context: sequelize } as never);
    await menuPreferences.down({ context: sequelize } as never);

    const foreignKeys = await menuForeignKeys();

    const userKey = foreignKeys.find((foreignKey) => foreignKey.from === 'user_id');
    expect(userKey).toMatchObject({
      table: 'users',
      to: 'id',
      on_delete: 'CASCADE',
      on_update: 'CASCADE',
    });

    const parentKey = foreignKeys.find((foreignKey) => foreignKey.from === 'parent_id');
    expect(parentKey).toMatchObject({
      table: 'menus',
      to: 'id',
      on_delete: 'SET NULL',
      on_update: 'CASCADE',
    });

    expect(foreignKeys.find((foreignKey) => foreignKey.from === 'permission_id')).toBeUndefined();
    expect(await sequelize.getQueryInterface().showAllTables()).not.toContain('user_menu_preferences');
  });
});
