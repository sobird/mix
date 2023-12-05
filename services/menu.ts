/**
 * 商家后台菜单
 *
 * sobird<i@sobird.me> at 2023/09/21 14:17:06 created.
 */

import http from '@/lib/axios';
import listToTree from '@/utils/listToTree';

console.log('http', http);
export interface IMenuItem {
  title: string;
  icon: string;
  url: string;
  id: string;
  parentId: string;
  code: string;
  auth: boolean;
  index: number;
  level: number;
  sortId: number;
  toolMenu: boolean;
  children?: IMenuItem[];

  last?: boolean;
}

export interface IMenuListResponse {
  menuItems: IMenuItem[];
  favorites: IMenuItem[];
}

export interface IMenuBadge {
  menuId: number;
  actionType?: 10 | 20;
  noticeStyle: 10 | 20 | 30;
  noticeContent: string;
}

export const Favorites: IMenuItem = {
  title: '常用功能',
  code: 'favorite-sub-menu',
  icon: 'favorite',
  id: 'favorite-sub-menu',
  index: 1,
  level: 0,
  parentId: '-1',
  sortId: 0,
  auth: true,
  toolMenu: true,
  url: '/favorite-sub-menu',
};

const MenuService = {
  async list(parentId?: number) {
    return http.get<IMenuListResponse>('/menu', { parentId }).then(({ menuItems = [], favorites = [] }) => {
      const items = menuItems.sort((a: any, b: any) => { return a.index - b.index; });
      const menuTrees = listToTree(items);
      // 标记最后一项
      menuTrees[menuTrees.length - 1].last = true;

      // Favorites.children = favorites.map(item => {
      //   item.url = item.url + '?fav';
      //   return item;
      // });

      return [menuTrees, menuItems, favorites];
    });
  },

  async update(data: Partial<IMenuListResponse>) {
    return http.patch('/menu', data);
  },

  /** 可将此接口合并到 /menu */
  async badges(menuId?: number) {
    return http.get<IMenuBadge[]>('/menu/badges', { menuId }).then((res) => {
      const badgeMap = new Map();
      return res?.reduce((pre, cur) => {
        if (!cur?.menuId) {
          return pre;
        }
        pre.set(cur?.menuId, cur);
        return pre;
      }, badgeMap);
    });
  },
};

export default MenuService;
