import type { AppActions, AppSubject } from '@/services/ability/types';

/** 菜单目录条目：由代码定义的菜单与可选的操作权限 */
export interface MenuDefinition {
  href: string;
  name: string;
  icon?: string;
  sort: number;
  permission?: { action: AppActions; subject: AppSubject };
}

/** 完整的菜单目录：按后台展示顺序排列 */
export const MENU_CATALOG: MenuDefinition[] = [
  { href: '/dashboard', name: '后台首页', sort: 0 },
  { href: '/dashboard/user', name: '用户管理', sort: 1, permission: { action: 'read', subject: 'User' } },
  { href: '/dashboard/role', name: '角色管理', sort: 2, permission: { action: 'read', subject: 'Role' } },
  {
    href: '/dashboard/permission',
    name: '权限管理',
    sort: 3,
    permission: { action: 'read', subject: 'Permission' },
  },
];
