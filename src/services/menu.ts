/**
 * 后台菜单
 *
 * 从全局菜单目录读取菜单，按用户能力过滤，并合并用户的菜单偏好。
 *
 * sobird<i@sobird.me> at 2023/09/21 14:17:06 created.
 */

import { Menu, Permission, UserMenuPreference } from '@/models';
import { buildAbility, isAllowed, loadUserGrants, type AppActions, type AppSubject } from '@/services/ability';

/** 渲染侧边栏所需的菜单节点 */
export interface MenuNode {
  id: number;
  name: string;
  href: string;
  icon: string | null;
  sort: number;
  favorite: boolean;
}

/** 当前用户可见的菜单与收藏 */
export interface MenuView {
  items: MenuNode[];
  favorites: MenuNode[];
}

const EMPTY_MENU: MenuView = { items: [], favorites: [] };

/** 先按偏好/目录排序，再按 id 稳定排序 */
function compareNodes(a: MenuNode, b: MenuNode): number {
  return a.sort - b.sort || a.id - b.id;
}

/**
 * 获取用户可见的菜单。
 *
 * - 访客返回空菜单；
 * - 无权限的菜单始终可见，有权限的菜单只在该动作的无条件规则下可见；
 * - 应用用户的收藏、隐藏与排序偏好。
 */
export async function getMenuForUser(userId: number | null): Promise<MenuView> {
  if (userId === null) {
    return { ...EMPTY_MENU };
  }

  const [menus, preferences, ability] = await Promise.all([
    Menu.findAll({ include: [Permission] }),
    UserMenuPreference.findAll({ where: { userId } }),
    loadUserGrants(userId).then(buildAbility),
  ]);

  const preferenceByMenuId = new Map(preferences.map((preference) => [preference.menuId, preference]));

  const items = menus
    .filter((menu) => {
      const preference = preferenceByMenuId.get(menu.id);
      if (preference?.hidden) {
        return false;
      }

      const permission = menu.Permission;
      if (!permission) {
        return true;
      }

      // 严格判断：条件规则返回的「可能允许」不算放行，菜单按失败关闭处理
      return isAllowed(ability, permission.action as AppActions, permission.subject as AppSubject);
    })
    .map((menu): MenuNode => {
      const preference = preferenceByMenuId.get(menu.id);

      return {
        id: menu.id,
        name: menu.name,
        href: menu.href,
        icon: menu.icon ?? null,
        sort: preference ? preference.sort : (menu.sort ?? 0),
        favorite: preference?.favorite ?? false,
      };
    })
    .sort(compareNodes);

  const favorites = items.filter((item) => item.favorite).sort(compareNodes);

  return { items, favorites };
}
