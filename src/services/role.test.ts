// @vitest-environment node

import { Role, UserRole } from '@/models';

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { createUser } from '../../tests/helpers/factories';
import { syncPermissionCatalog } from './permission-catalog';
import RoleService from './role';

useInMemoryDatabase();

describe('RoleService.assignDefaultRole', () => {
  it('assigns the default role to a new user', async () => {
    const user = await createUser();

    await RoleService.assignDefaultRole(user.id);

    const roles = await user.getRoles();
    expect(roles.map((role) => role.name)).toContain('成员');
  });

  it('does not duplicate the user role when called twice', async () => {
    const user = await createUser();
    const defaultRole = await Role.findOne({ where: { isDefault: true } });
    expect(defaultRole).not.toBeNull();

    await RoleService.assignDefaultRole(user.id);
    await RoleService.assignDefaultRole(user.id);

    expect(await UserRole.count({ where: { userId: user.id, roleId: defaultRole!.id } })).toBe(1);
  });

  it('warns and does not throw when there is no default role', async () => {
    const user = await createUser();
    await Role.update({ isDefault: false }, { where: { isDefault: true } });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(RoleService.assignDefaultRole(user.id)).resolves.toBeUndefined();

    expect(warn).toHaveBeenCalled();
    expect(await UserRole.count({ where: { userId: user.id } })).toBe(0);

    warn.mockRestore();
  });
});

describe('RoleService.assignOwnerToFirstUser', () => {
  it('assigns owner to the earliest user only', async () => {
    const first = await createUser();
    const second = await createUser();
    await syncPermissionCatalog();
    expect(await RoleService.assignOwnerToFirstUser()).toBe(first.id);
    expect(await RoleService.assignOwnerToFirstUser()).toBeNull(); // 已存在拥有者
    const role = await first.getRoles();
    expect(role.map((r) => r.name)).toContain('拥有者');
    const secondRoles = await second.getRoles();
    expect(secondRoles.map((r) => r.name)).not.toContain('拥有者');
  });
  it('is a no-op on an empty database', async () => {
    expect(await RoleService.assignOwnerToFirstUser()).toBeNull();
  });
});
