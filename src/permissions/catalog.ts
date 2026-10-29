import type { AppActions, AppSubject } from '@/services/ability/types';

/** 权限目录条目：由代码定义的 action/subject 与展示名称 */
export interface CatalogPermission {
  action: AppActions;
  subject: AppSubject;
  name: string;
}

const SUBJECTS = ['User', 'Role', 'Permission'] as const;
const CRUD_ACTIONS = ['create', 'read', 'update', 'delete'] as const;

const SUBJECT_LABELS: Record<(typeof SUBJECTS)[number], string> = {
  User: '用户',
  Role: '角色',
  Permission: '权限',
};

const ACTION_LABELS: Record<(typeof CRUD_ACTIONS)[number], string> = {
  create: '创建',
  read: '查看',
  update: '更新',
  delete: '删除',
};

/** 完整的权限目录：12 条 CRUD 权限 + 1 条 manage all */
export const PERMISSION_CATALOG: CatalogPermission[] = [
  ...SUBJECTS.flatMap((subject) =>
    CRUD_ACTIONS.map((action) => ({
      action,
      subject,
      name: `${ACTION_LABELS[action]}${SUBJECT_LABELS[subject]}`,
    })),
  ),
  { action: 'manage', subject: 'all', name: '系统管理' },
];

const CRUD_PERMISSIONS = PERMISSION_CATALOG.filter((permission) => permission.action !== 'manage');
const READ_PERMISSIONS = PERMISSION_CATALOG.filter((permission) => permission.action === 'read');

/** 内置角色的权限阶梯：拥有者管理一切，管理员拥有全部 CRUD，成员只读 */
export const BUILTIN_ROLE_GRANTS: Record<'owner' | 'admin' | 'member', CatalogPermission[]> = {
  owner: PERMISSION_CATALOG.filter((permission) => permission.action === 'manage' && permission.subject === 'all'),
  admin: CRUD_PERMISSIONS,
  member: READ_PERMISSIONS,
};
