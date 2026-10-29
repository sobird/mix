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
  });

  it('grants the ladder to builtin roles', async () => {
    await syncPermissionCatalog();
    const owner = await Role.findOne({ where: { name: '拥有者' } });
    expect(owner).not.toBeNull();
    const ability = buildAbility(await loadGrantsForRole(owner!.id));
    expect(ability.can('manage', 'all')).toBe(true);
  });

  it('does not touch custom role grants', async () => {
    const custom = await createRole();
    const permission = await createPermission({ action: 'read', subject: 'User' });
    await createRolePermission({ roleId: custom.id, permissionId: permission.id });
    await syncPermissionCatalog();
    expect(await RolePermission.count({ where: { roleId: custom.id } })).toBe(1);
  });
});
