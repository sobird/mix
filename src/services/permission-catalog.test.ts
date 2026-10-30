// @vitest-environment node

import { Permission, Role, RolePermission } from '@/models';
import { PERMISSION_CATALOG } from '@/permissions/catalog';

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { createPermission, createRole, createRolePermission } from '../../tests/helpers/factories';
import { buildAbility } from './ability/build';
import { normalizeNarrowing } from './ability/narrowing';
import type { AbilityGrant } from './ability/types';
import { syncPermissionCatalog } from './permission-catalog';

useInMemoryDatabase();

/** 测试专用：把某个角色的授予行转换为 CASL 能力条目，无法解析的规则直接跳过 */
async function loadGrantsForRole(roleId: number): Promise<AbilityGrant[]> {
  const rows = await RolePermission.findAll({
    where: { roleId },
    include: [{ model: Permission, required: true }],
  });

  const grants: AbilityGrant[] = [];

  for (const row of rows) {
    const narrowing = normalizeNarrowing(row.narrowing);
    if (narrowing === null) {
      continue;
    }

    grants.push({
      action: row.Permission.action,
      subject: row.Permission.subject,
      narrowing,
      expiresAt: row.expiresAt,
    });
  }

  return grants;
}

describe('syncPermissionCatalog', () => {
  it('creates catalog permissions and builtin grants once', async () => {
    const first = await syncPermissionCatalog();
    expect(first.permissions).toBe(PERMISSION_CATALOG.length);
    const second = await syncPermissionCatalog();
    expect(second.permissions).toBe(0);
    expect(await Permission.count()).toBe(PERMISSION_CATALOG.length);
    expect(await Role.count()).toBe(3);
  });

  it('grants the ladder to builtin roles', async () => {
    await syncPermissionCatalog();
    const roles = await Role.findAll({ order: [['id', 'ASC']] });
    expect(roles.map((role) => role.name)).toEqual(['拥有者', '管理员', '成员']);

    const owner = roles[0];
    expect(owner.isBuiltin).toBe(true);
    expect(owner.editable).toBe(false);
    expect(roles[2].isDefault).toBe(true);

    const ability = buildAbility(await loadGrantsForRole(owner.id));
    expect(ability.can('manage', 'all')).toBe(true);
  });

  it('does not touch custom role grants', async () => {
    const custom = await createRole();
    const permission = await createPermission({ action: 'read', subject: 'User' });
    await createRolePermission({ roleId: custom.id, permissionId: permission.id });
    await syncPermissionCatalog();
    expect(await RolePermission.count({ where: { roleId: custom.id } })).toBe(1);
  });

  it('keeps catalog additions after re-sync', async () => {
    const originalLength = PERMISSION_CATALOG.length;

    try {
      await syncPermissionCatalog();

      // 临时向目录追加一条真实模型主题的权限，再同步一次
      PERMISSION_CATALOG.push({ action: 'read', subject: 'Log', name: '查看日志' });
      const second = await syncPermissionCatalog();

      expect(second.permissions).toBe(1);
      expect(await Permission.count()).toBe(originalLength + 1);
      expect(await Permission.count({ where: { action: 'read', subject: 'Log' } })).toBe(1);

      // 原有内置角色的授予不应因目录变化而丢失（拥有者只有 manage all 一条）
      const owner = await Role.findOne({ where: { name: '拥有者' } });
      expect(owner).not.toBeNull();
      expect(await RolePermission.count({ where: { roleId: owner!.id } })).toBe(1);
    } finally {
      PERMISSION_CATALOG.length = originalLength;
    }
  });

  it('does not delete existing grants when a catalog entry is removed', async () => {
    const originalLength = PERMISSION_CATALOG.length;

    try {
      await syncPermissionCatalog();

      // 先添加一条临时目录项并同步，随后授予自定义角色
      PERMISSION_CATALOG.push({ action: 'read', subject: 'Log', name: '查看日志' });
      await syncPermissionCatalog();

      const added = await Permission.findOne({ where: { action: 'read', subject: 'Log' } });
      expect(added).not.toBeNull();

      const custom = await createRole();
      await createRolePermission({ roleId: custom.id, permissionId: added!.id });

      // 从目录移除后再次同步，自定义授予与权限行都应保留
      PERMISSION_CATALOG.length = originalLength;
      await syncPermissionCatalog();

      expect(await RolePermission.count({ where: { roleId: custom.id, permissionId: added!.id } })).toBe(1);
      expect(await Permission.count({ where: { action: 'read', subject: 'Log' } })).toBe(1);
    } finally {
      PERMISSION_CATALOG.length = originalLength;
    }
  });
});
