import {
  RoleModel, PermissionModel, RolePermissionModel, sequelize,
} from '@/models';

vi.mock('@/models');

it.skip('find role permission', () => {
  // todo
});

it.skip('set role permission', async () => {
  const role = await RoleModel.findByPk(1, { include: [PermissionModel] });

  if (!role) {
    return;
  }

  const permissions = role.Permissions;
  console.log('permissions', permissions);

  const rolePermissionModel1 = await RolePermissionModel.findAll();
  console.log('rolePermissionModel1', rolePermissionModel1.map((item) => { return item.toJSON(); }));

  // 删除角色权限
  await role.setPermissions([]);

  const rolePermissionModel2 = await RolePermissionModel.findAll();
  console.log('rolePermissionModel2', rolePermissionModel2.map((item) => { return item.toJSON(); }));

  const permissionList = await PermissionModel.findAll({ include: [RoleModel] });
  console.log('permissionList', permissionList[5].Roles);
});

const role = await RoleModel.findByPk(1, { include: [PermissionModel] });

// 获取角色权限列表
const aaa = [];
role?.Permissions.forEach((permission) => {
  const rules = permission.RolePermission.rules || [];
  console.log(permission, rules);

  aaa.push({
    action: permission.action,
    subject: permission.subject,
  });
});

console.log('aaa', aaa);
