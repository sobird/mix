// @vitest-environment node

import { useInMemoryDatabase } from '../../../tests/helpers/database';
import {
  createPermission,
  createRole,
  createRolePermission,
  createUser,
  createUserRole,
} from '../../../tests/helpers/factories';
import { expandRoleIds, loadUserGrants } from './sources';

useInMemoryDatabase();

describe('loadUserGrants', () => {
  let user: Awaited<ReturnType<typeof createUser>>;

  beforeEach(async () => {
    user = await createUser();
  });

  it('returns an empty list for an unknown user', async () => {
    expect(await loadUserGrants(9999)).toEqual([]);
  });

  it('inherits grants from ancestor roles', async () => {
    // parent(manage all) -> child(read User)，用户只绑 child
    const parent = await createRole();
    const child = await createRole({ parentId: parent.id });
    const perm = await createPermission({ action: 'manage', subject: 'all' });
    await createRolePermission({ roleId: parent.id, permissionId: perm.id });
    await createUserRole({ userId: user.id, roleId: child.id });

    const grants = await loadUserGrants(user.id);
    expect(grants).toContainEqual(expect.objectContaining({ action: 'manage', subject: 'all' }));
  });

  it('skips expired and malformed grants', async () => {
    const role = await createRole();
    const expired = await createPermission({ action: 'read', subject: 'User' });
    const broken = await createPermission({ action: 'update', subject: 'User' });
    await createRolePermission({ roleId: role.id, permissionId: expired.id, expiresAt: new Date('2000-01-01') });
    await createRolePermission({ roleId: role.id, permissionId: broken.id, narrowing: 'oops' as never });
    await createUserRole({ userId: user.id, roleId: role.id });

    expect(await loadUserGrants(user.id)).toEqual([]);
  });

  it('skips expired role assignments and grants', async () => {
    const target = await createUser();
    const role = await createRole();
    const permission = await createPermission({ action: 'read', subject: 'User' });
    await createUserRole({ userId: target.id, roleId: role.id, expiresAt: new Date('2000-01-01') });
    await createRolePermission({ roleId: role.id, permissionId: permission.id });
    expect(await loadUserGrants(target.id)).toEqual([]);
  });

  it('reads narrowing from the grant row', async () => {
    const target = await createUser();
    const role = await createRole();
    const permission = await createPermission({ action: 'update', subject: 'Role' });
    await createRolePermission({
      roleId: role.id,
      permissionId: permission.id,
      narrowing: { conditions: { id: 1 } },
    });
    await createUserRole({ userId: target.id, roleId: role.id });
    expect(await loadUserGrants(target.id)).toEqual([
      { action: 'update', subject: 'Role', narrowing: { conditions: { id: 1 } }, expiresAt: null },
    ]);
  });

  it('dedupes grants with the same action, subject and narrowing', async () => {
    const parent = await createRole();
    const child = await createRole({ parentId: parent.id });
    const permission = await createPermission({ action: 'read', subject: 'User' });
    await createRolePermission({ roleId: parent.id, permissionId: permission.id });
    await createRolePermission({ roleId: child.id, permissionId: permission.id });
    await createUserRole({ userId: user.id, roleId: child.id });

    const grants = await loadUserGrants(user.id);
    expect(grants).toHaveLength(1);
    expect(grants[0]).toEqual(expect.objectContaining({ action: 'read', subject: 'User', narrowing: {} }));
  });
});

describe('expandRoleIds', () => {
  it('expands ancestors and stops on cycles', () => {
    const roles = [
      { id: 1, parentId: 2 },
      { id: 2, parentId: 1 },
      { id: 3, parentId: null },
    ];

    expect([...expandRoleIds([1], roles)].sort()).toEqual([1, 2]);
    expect(expandRoleIds([3], roles)).toEqual([3]);
  });
});
