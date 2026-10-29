import { DataTypes, type Sequelize } from 'sequelize';

import type { Migration } from '@/lib/migrator';

// Sequelize 6 把 `showIndex` 的返回值声明为 `object`，这里收窄到实际用到的字段。
type IndexInfo = { name: string };

function toIndexList(indexes: object): IndexInfo[] {
  return indexes as IndexInfo[];
}

/** 重建期间使用的临时表名，避免与现有表冲突。 */
const REBUILD_TABLE = 'menus__migration_backup';

/** 两条迁移路径共享的数据列，按 sync 生成顺序排列。 */
const MENU_DATA_COLUMNS = [
  'id',
  'name',
  'href',
  'icon',
  'description',
  'parent_id',
  'sort',
  'created_at',
  'updated_at',
  'deleted_at',
] as const;

type MenuIndex = { name: string; fields: string[] };

/**
 * 手写目标表的 CREATE TABLE。
 *
 * SQLite 的 `removeColumn`/`changeColumn` 会依据 `describeTable` 重建表，
 * 而 `describeTable` 只保留 `{ model, key }` 形式的外键，会丢掉
 * `ON DELETE`/`ON UPDATE` 动作与 `AUTOINCREMENT`。因此升级时改为按显式目标
 * schema 一次性重建，保证升级后的表结构与 sync 生成的完全一致。
 */
function createMenusSql(table: string, phase1: boolean): string {
  const columns = [
    '  `id` INTEGER PRIMARY KEY AUTOINCREMENT,',
    phase1
      ? '  `user_id` INTEGER REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,'
      : '  `permission_id` INTEGER REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,',
    '  `name` VARCHAR(255) NOT NULL,',
    '  `href` VARCHAR(255) NOT NULL,',
    '  `icon` VARCHAR(255),',
    '  `description` VARCHAR(255),',
    '  `parent_id` INTEGER REFERENCES `menus` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,',
    '  `sort` INTEGER,',
    '  `created_at` DATETIME NOT NULL,',
    '  `updated_at` DATETIME NOT NULL,',
    '  `deleted_at` DATETIME',
  ];

  return `CREATE TABLE \`${table}\` (\n${columns.join('\n')}\n)`;
}

/**
 * 以显式目标 schema 重建 `menus` 并保留行数据。
 *
 * 重建顺序为“建临时表 → 拷贝数据 → 删旧表 → 重命名临时表”。临时表本身
 * 外键指向 `menus` 与 `permissions`，因此不会像“先重命名旧表”那样把其它表
 * （例如 `user_menu_preferences`）的外键改成指向备份表。整个过程放在事务里并
 * 打开 `defer_foreign_keys`，避免拷贝/删表顺序触发即时外键检查。
 */
async function rebuildMenus(sequelize: Sequelize, phase1: boolean): Promise<void> {
  const columns = await sequelize.getQueryInterface().describeTable('menus');
  const copyColumns = MENU_DATA_COLUMNS.filter((column) => columns[column]);

  const targetColumns: string[] = [];
  const selectExpressions: string[] = [];

  for (const column of copyColumns) {
    targetColumns.push(`\`${column}\``);
    // 真实旧库的时间戳是 NOT NULL；这里兼容早期手工建表可能留下的空值。
    selectExpressions.push(
      column === 'created_at' || column === 'updated_at'
        ? `COALESCE(\`${column}\`, CURRENT_TIMESTAMP)`
        : `\`${column}\``,
    );
  }

  if (!phase1) {
    targetColumns.push('`permission_id`');
    selectExpressions.push(columns.permission_id ? '`permission_id`' : 'NULL');
  }

  await sequelize.transaction(async (transaction) => {
    await sequelize.query('PRAGMA defer_foreign_keys = ON', { transaction });
    await sequelize.query(createMenusSql(REBUILD_TABLE, phase1), { transaction });
    await sequelize.query(
      `INSERT INTO \`${REBUILD_TABLE}\` (${targetColumns.join(', ')}) SELECT ${selectExpressions.join(
        ', ',
      )} FROM \`menus\``,
      { transaction },
    );
    await sequelize.query('DROP TABLE `menus`', { transaction });
    await sequelize.query(`ALTER TABLE \`${REBUILD_TABLE}\` RENAME TO \`menus\``, { transaction });
  });
}

/** 补回缺失的 `menus` 索引（重建会连带删除旧表上的索引）。 */
async function ensureMenuIndexes(sequelize: Sequelize, indexes: MenuIndex[]): Promise<void> {
  const queryInterface = sequelize.getQueryInterface();
  const existing = toIndexList(await queryInterface.showIndex('menus'));
  const missing = indexes.filter((index) => !existing.some((current) => current.name === index.name));

  await Promise.all(missing.map((index) => queryInterface.addIndex('menus', [...index.fields], { name: index.name })));
}

/**
 * 菜单全局化：把 `menus` 从“用户私有菜单”升级为“按权限关联的全局菜单”，
 * 并新增 `user_menu_preferences` 保存每个用户的收藏/隐藏/排序偏好。
 */
export const menuPreferences: Migration = {
  name: '002-menu-preferences',
  async up({ context }) {
    const queryInterface = context.getQueryInterface();
    const columns = await queryInterface.describeTable('menus');

    // 已经升级过的表（有 permission_id、没有 user_id）不重建，保证幂等。
    if (columns.user_id || !columns.permission_id) {
      await rebuildMenus(context, false);
    }

    await ensureMenuIndexes(context, [
      { name: 'menus_parent_id', fields: ['parent_id'] },
      { name: 'menus_permission_id', fields: ['permission_id'] },
    ]);

    const tables = await queryInterface.showAllTables();
    if (!tables.includes('user_menu_preferences')) {
      await queryInterface.createTable('user_menu_preferences', {
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        menu_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          references: { model: 'menus', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        favorite: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        hidden: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        sort: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
        },
      });
    }
  },
  async down({ context }) {
    const queryInterface = context.getQueryInterface();
    const tables = await queryInterface.showAllTables();

    if (tables.includes('user_menu_preferences')) {
      await queryInterface.dropTable('user_menu_preferences');
    }

    const columns = await queryInterface.describeTable('menus');

    // 恢复到 phase 1：去掉 permission_id、恢复带 CASCADE 的 user_id 外键。
    if (columns.permission_id || !columns.user_id) {
      await rebuildMenus(context, true);
    }

    await ensureMenuIndexes(context, [
      { name: 'menus_parent_id', fields: ['parent_id'] },
      { name: 'menus_user_id', fields: ['user_id'] },
    ]);
  },
};
