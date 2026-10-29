// @vitest-environment node

import { Permission } from '@/models';

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { createRole, createRolePermission, createUser, createUserRole } from '../../tests/helpers/factories';
import { getMenuForUser } from './menu';
import { syncMenuCatalog } from './menu-catalog';
import { syncPermissionCatalog } from './permission-catalog';

useInMemoryDatabase();

describe('getMenuForUser', () => {
  it('returns an empty menu for guests', async () => {
    expect(await getMenuForUser(null)).toEqual({ items: [], favorites: [] });
  });

  it('filters menus by unconditional read permission', async () => {
    await syncPermissionCatalog();
    await syncMenuCatalog();
    const user = await createUser();
    const role = await createRole();
    const permission = await Permission.findOne({ where: { action: 'read', subject: 'User' } });
    await createRolePermission({ roleId: role.id, permissionId: permission!.id });
    await createUserRole({ userId: user.id, roleId: role.id });
    const view = await getMenuForUser(user.id);
    expect(view.items.map((item) => item.href)).toEqual(['/dashboard', '/dashboard/user']);
  });

  it('hides menus for conditional read grants', async () => {
    await syncPermissionCatalog();
    await syncMenuCatalog();
    const user = await createUser();
    const role = await createRole();
    const permission = await Permission.findOne({ where: { action: 'read', subject: 'User' } });
    await createRolePermission({
      roleId: role.id,
      permissionId: permission!.id,
      narrowing: { conditions: { id: 1 } },
    });
    await createUserRole({ userId: user.id, roleId: role.id });
    const view = await getMenuForUser(user.id);
    expect(view.items.map((item) => item.href)).toEqual(['/dashboard']);
    expect(view.items.map((item) => item.href)).not.toContain('/dashboard/user');
  });
});
