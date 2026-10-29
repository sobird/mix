// @vitest-environment node

import { Role, UserRole } from '@/models';

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { createUser } from '../../tests/helpers/factories';
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
