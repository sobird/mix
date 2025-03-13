import {
  RoleModel, PermissionModel, RolePermissionModel,
} from '@/models';

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

const rolePermissionModel1 = await RolePermissionModel.findAll();
console.log('rolePermissionModel1', rolePermissionModel1.map((item) => { return item.toJSON(); }));

await saveRolePermissions(1, permissions);
await saveRolePermissions(1, permissions);

const rolePermissionModel2 = await RolePermissionModel.findAll();
console.log('rolePermissionModel2', rolePermissionModel2.map((item) => { return item.toJSON(); }));

const permissionList = await PermissionModel.findAll();

console.log('permissionList', permissionList.map((item) => { return item.toJSON(); }));

const role = await RoleModel.findByPk(1, {
  include: {
    model: PermissionModel,
    through: { attributes: ['rules'] },
  },
});

role?.Permissions.forEach((permission) => {
  const rules = permission.RolePermission.rules || [];
  console.log('rules', rules);
});
