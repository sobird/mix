/**
 * 用户菜单偏好
 *
 * 收藏、隐藏与排序存放在 `UserMenuPreference`，这里只处理收藏的写入。
 */

import { sequelize, UserMenuPreference } from '@/models';

/** 收藏菜单的数量上限 */
export const MAX_FAVORITE_MENUS = 10;

/**
 * 覆盖用户的收藏菜单。
 *
 * 在同一事务内先把该用户的全部偏好取消收藏，再逐条 upsert 传入的菜单，
 * 只更新 `favorite` 字段，不影响已有的 `hidden` / `sort`。
 */
export async function setFavoriteMenus(userId: number, menuIds: number[]): Promise<void> {
  if (menuIds.length > MAX_FAVORITE_MENUS) {
    throw new Error(`收藏菜单不能超过 ${MAX_FAVORITE_MENUS} 个`);
  }

  await sequelize.transaction(async (transaction) => {
    await UserMenuPreference.update({ favorite: false }, { where: { userId }, transaction });

    for (const menuId of new Set(menuIds)) {
      // oxlint-disable-next-line no-await-in-loop
      await UserMenuPreference.upsert({ userId, menuId, favorite: true }, { transaction });
    }
  });
}
