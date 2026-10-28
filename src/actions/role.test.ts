import { Permission, Role, RolePermission } from '@/models';

import { saveRolePermissions } from './role';

vi.mock('@/models');

const permissions = [
  {
    subject: 'User',
    actions: [
      { action: 'read', fields: ['username', 'email'] },
      { action: 'update', fields: ['username', 'email'] },
    ],
  },
];

describe('saveRolePermissions', () => {
  it('replaces a role permissions and stores the rules payload', async () => {
    await saveRolePermissions(1, permissions);

    const rows = await RolePermission.findAll({ where: { roleId: 1 } });
    expect(rows).toHaveLength(2);

    const role = await Role.findByPk(1, {
      include: [{ model: Permission, through: { attributes: ['rules'] } }],
    });
    const read = role?.Permissions.find((permission) => permission.action === 'read');
    expect(read?.RolePermission.rules).toEqual(['username', 'email']);
  });

  it('is idempotent when called repeatedly', async () => {
    await saveRolePermissions(1, permissions);
    await saveRolePermissions(1, permissions);

    expect(await RolePermission.count({ where: { roleId: 1 } })).toBe(2);
  });
});
