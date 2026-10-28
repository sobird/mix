import { Role, Permission, RolePermission } from '@/models';

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

const rolePermission1 = await RolePermission.findAll();
console.log(
  'rolePermission1',
  rolePermission1.map((item) => {
    return item.toJSON();
  }),
);

await saveRolePermissions(1, permissions);
await saveRolePermissions(1, permissions);

const rolePermission2 = await RolePermission.findAll();
console.log(
  'rolePermission2',
  rolePermission2.map((item) => {
    return item.toJSON();
  }),
);

const permissionList = await Permission.findAll();

console.log(
  'permissionList',
  permissionList.map((item) => {
    return item.toJSON();
  }),
);

const role = await Role.findByPk(1, {
  include: {
    model: Permission,
    through: { attributes: ['rules'] },
  },
});

role?.Permissions.forEach((permission) => {
  const rules = permission.RolePermission.rules || [];
  console.log('rules', rules);
});
