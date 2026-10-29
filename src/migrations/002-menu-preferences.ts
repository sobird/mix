import { DataTypes } from 'sequelize';

import type { Migration } from '@/lib/migrator';

// Sequelize 6 把 `showIndex` 的返回值声明为 `object`，这里收窄到实际用到的字段。
type IndexInfo = { name: string };

function toIndexList(indexes: object): IndexInfo[] {
  return indexes as IndexInfo[];
}

/**
 * 菜单全局化：把 `menus` 从“用户私有菜单”升级为“按权限关联的全局菜单”，
 * 并新增 `user_menu_preferences` 保存每个用户的收藏/隐藏/排序偏好。
 *
 * SQLite 的 `removeColumn` 会重建整张表并丢掉索引，因此升级后需要补回索引。
 */
export const menuPreferences: Migration = {
  name: '002-menu-preferences',
  async up({ context }) {
    const queryInterface = context.getQueryInterface();
    const columns = await queryInterface.describeTable('menus');

    if (columns.user_id) {
      const indexes = toIndexList(await queryInterface.showIndex('menus'));
      if (indexes.some((index) => index.name === 'menus_user_id')) {
        await queryInterface.removeIndex('menus', 'menus_user_id');
      }
      await queryInterface.removeColumn('menus', 'user_id');
    }

    if (!columns.permission_id) {
      await queryInterface.addColumn('menus', 'permission_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'permissions', key: 'id' },
        onDelete: 'CASCADE',
      });
    }

    const menusIndexes = toIndexList(await queryInterface.showIndex('menus'));
    const missingMenusIndexes = [
      { name: 'menus_parent_id', fields: ['parent_id'] },
      { name: 'menus_permission_id', fields: ['permission_id'] },
    ].filter((index) => !menusIndexes.some((existing) => existing.name === index.name));

    await Promise.all(
      missingMenusIndexes.map((index) => queryInterface.addIndex('menus', index.fields, { name: index.name })),
    );

    const tables = await queryInterface.showAllTables();
    if (!tables.includes('user_menu_preferences')) {
      await queryInterface.createTable('user_menu_preferences', {
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
        },
        menu_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          references: { model: 'menus', key: 'id' },
          onDelete: 'CASCADE',
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
    const indexes = toIndexList(await queryInterface.showIndex('menus'));

    if (indexes.some((index) => index.name === 'menus_permission_id')) {
      await queryInterface.removeIndex('menus', 'menus_permission_id');
    }
    if (columns.permission_id) {
      await queryInterface.removeColumn('menus', 'permission_id');
    }
    if (!columns.user_id) {
      await queryInterface.addColumn('menus', 'user_id', {
        type: DataTypes.INTEGER,
      });
    }

    const rebuiltIndexes = toIndexList(await queryInterface.showIndex('menus'));
    const restoredIndexes = [
      { name: 'menus_parent_id', fields: ['parent_id'] },
      { name: 'menus_user_id', fields: ['user_id'] },
    ].filter((index) => !rebuiltIndexes.some((existing) => existing.name === index.name));

    await Promise.all(
      restoredIndexes.map((index) => queryInterface.addIndex('menus', index.fields, { name: index.name })),
    );
  },
};
