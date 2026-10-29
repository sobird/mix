import { MENU_CATALOG } from '@/menus/catalog';
import { Menu, Permission, sequelize, type MenuCreationAttributes } from '@/models';

/**
 * 将代码中的菜单目录同步到数据库。
 *
 * - 菜单按 `href` 做 `findOrCreate`，已存在时更新名称、图标、排序与权限；
 * - 定义带权限时按 (action, subject) 查权限，缺失直接抛错让部署失败；
 * - 绝不删除目录之外的菜单。
 */
export async function syncMenuCatalog(): Promise<{ menus: number }> {
  return sequelize.transaction(async (transaction) => {
    let createdMenus = 0;

    // SQLite 单连接下事务内的查询必须串行，不能使用 Promise.all 并行
    for (const definition of MENU_CATALOG) {
      let permissionId: number | null = null;

      if (definition.permission) {
        const { action, subject } = definition.permission;
        // oxlint-disable-next-line no-await-in-loop
        const permission = await Permission.findOne({ where: { action, subject }, transaction });

        if (!permission) {
          throw new Error(`菜单目录引用的权限不存在: ${action} ${subject} (${definition.href})`);
        }

        permissionId = permission.id;
      }

      // oxlint-disable-next-line no-await-in-loop
      const [menu, created] = await Menu.findOrCreate({
        where: { href: definition.href },
        defaults: {
          href: definition.href,
          name: definition.name,
          sort: definition.sort,
          permissionId,
          ...(definition.icon === undefined ? {} : { icon: definition.icon }),
        } as MenuCreationAttributes,
        transaction,
      });

      if (created) {
        createdMenus += 1;
      } else {
        // oxlint-disable-next-line no-await-in-loop
        await menu.update(
          { name: definition.name, icon: definition.icon, sort: definition.sort, permissionId },
          { transaction },
        );
      }
    }

    return { menus: createdMenus };
  });
}
