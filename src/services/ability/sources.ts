import { Permission, Role, RolePermission, UserRole } from '@/models';

import { normalizeNarrowing } from './narrowing';
import type { AbilityGrant } from './types';

/** 角色树的最小结构，仅用于向上展开继承链 */
export interface RoleLink {
  id: number;
  parentId?: number | null;
}

/**
 * 将用户直接绑定的角色展开为其全部祖先角色。
 *
 * 沿 `parentId` 向上遍历，`visited` 保证环不会造成死循环，
 * 同时最多遍历角色总数个节点，防止异常数据导致无限扩展。
 */
export function expandRoleIds(roleIds: number[], roles: RoleLink[]): number[] {
  const parentById = new Map<number, number | null>();
  for (const role of roles) {
    parentById.set(role.id, role.parentId ?? null);
  }

  const seen = new Set<number>();
  const ordered: number[] = [];
  const queue: number[] = [];

  for (const id of roleIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    ordered.push(id);
    queue.push(id);
  }

  let budget = roles.length;

  while (queue.length > 0 && budget > 0) {
    const id = queue.shift() as number;
    budget -= 1;

    const parentId = parentById.get(id);
    if (parentId === null || parentId === undefined || seen.has(parentId)) {
      continue;
    }

    seen.add(parentId);
    ordered.push(parentId);
    queue.push(parentId);
  }

  return ordered;
}

/**
 * 从数据库加载用户的全部授予，包含角色继承链上的授予。
 *
 * 失败关闭：过期的权限与无法解析的规则会被跳过并告警，绝不抛出异常。
 * 未知用户返回空数组。
 */
export async function loadUserGrants(userId: number): Promise<AbilityGrant[]> {
  const userRoles = await UserRole.findAll({ where: { userId }, attributes: ['roleId'] });
  if (userRoles.length === 0) {
    return [];
  }

  const directRoleIds = userRoles.map((userRole) => userRole.roleId);
  const roles = await Role.findAll({ attributes: ['id', 'parentId'] });
  const expandedRoleIds = expandRoleIds(directRoleIds, roles);

  const rolePermissionRows = await RolePermission.findAll({
    where: { roleId: expandedRoleIds },
    include: [{ model: Permission, required: true }],
  });

  const now = Date.now();
  const seen = new Set<string>();
  const grants: AbilityGrant[] = [];

  for (const rolePermission of rolePermissionRows) {
    const permission = rolePermission.Permission;

    if (!permission) {
      continue;
    }

    // expires 为空表示永不过期；过期时间等于当前时刻同样视为过期
    if (permission.expires && new Date(permission.expires).getTime() <= now) {
      continue;
    }

    const narrowing = normalizeNarrowing(rolePermission.rules);
    if (narrowing === null) {
      console.warn(
        `[ability] 跳过无法解析的规则 roleId=${rolePermission.roleId} permissionId=${rolePermission.permissionId}`,
      );
      continue;
    }

    const key = `${permission.action}\u0000${permission.subject}\u0000${JSON.stringify(narrowing)}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    grants.push({
      action: permission.action,
      subject: permission.subject,
      narrowing,
      expiresAt: permission.expires,
    });
  }

  return grants;
}
