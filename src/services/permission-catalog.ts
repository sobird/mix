import { Permission, Role, sequelize } from '@/models';
import { BUILTIN_ROLE_GRANTS, PERMISSION_CATALOG, type CatalogPermission } from '@/permissions/catalog';

interface BuiltinRoleDefinition {
  key: keyof typeof BUILTIN_ROLE_GRANTS;
  name: string;
  defaults: {
    description: string;
    isBuiltin: boolean;
    isDefault?: boolean;
    editable?: boolean;
    defaultable?: boolean;
  };
}

const BUILTIN_ROLE_DEFINITIONS: BuiltinRoleDefinition[] = [
  {
    key: 'owner',
    name: '拥有者',
    defaults: { description: '系统拥有者角色', isBuiltin: true, editable: false, defaultable: false },
  },
  {
    key: 'admin',
    name: '管理员',
    defaults: { description: '系统管理员角色', isBuiltin: true },
  },
  {
    key: 'member',
    name: '成员',
    defaults: { description: '普通用户角色', isBuiltin: true, isDefault: true },
  },
];

/** 目录条目的唯一键，与数据库 UNIQUE(action, subject) 对应 */
function catalogKey(permission: Pick<CatalogPermission, 'action' | 'subject'>): string {
  return `${permission.action}\u0000${permission.subject}`;
}

/**
 * 将代码中的权限目录同步到数据库，并重建内置角色的授予。
 *
 * - 权限按 (action, subject) 做 `findOrCreate`，已存在时只更新展示名称；
 * - 三个内置角色按名称 `findOrCreate`，随后以目录为准重建其授予；
 * - 绝不删除自定义角色，也不会删除目录之外的权限行。
 */
export async function syncPermissionCatalog(): Promise<{ permissions: number; grants: number }> {
  return sequelize.transaction(async (transaction) => {
    const permissionByKey = new Map<string, Permission>();
    let createdPermissions = 0;

    // SQLite 单连接下事务内的查询必须串行，不能使用 Promise.all 并行
    for (const entry of PERMISSION_CATALOG) {
      // oxlint-disable-next-line no-await-in-loop
      const [permission, created] = await Permission.findOrCreate({
        where: { action: entry.action, subject: entry.subject },
        defaults: {
          action: entry.action,
          subject: entry.subject,
          name: entry.name,
          description: entry.name,
        },
        transaction,
      });

      if (created) {
        createdPermissions += 1;
      } else if (permission.name !== entry.name) {
        // oxlint-disable-next-line no-await-in-loop
        await permission.update({ name: entry.name }, { transaction });
      }

      permissionByKey.set(catalogKey(entry), permission);
    }

    let grants = 0;

    for (const definition of BUILTIN_ROLE_DEFINITIONS) {
      // oxlint-disable-next-line no-await-in-loop
      const [role] = await Role.findOrCreate({
        where: { name: definition.name },
        defaults: { name: definition.name, ...definition.defaults },
        transaction,
      });

      // 只允许触碰内置角色：若同名角色是自定义角色，则保持原状
      if (!role.isBuiltin) {
        continue;
      }

      const targets = BUILTIN_ROLE_GRANTS[definition.key]
        .map((entry) => permissionByKey.get(catalogKey(entry)))
        .filter((permission): permission is Permission => permission !== undefined);

      // oxlint-disable-next-line no-await-in-loop
      await role.setPermissions(targets, { transaction });
      grants += targets.length;
    }

    return { permissions: createdPermissions, grants };
  });
}
