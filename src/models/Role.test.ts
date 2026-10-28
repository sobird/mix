import { Role, Permission, RolePermission } from '@/models';

vi.mock('@/models');

// oxlint-disable-next-line vitest/no-disabled-tests
it.skip('find role permission', () => {
  // todo
});

// oxlint-disable-next-line vitest/no-disabled-tests
it.skip('set role permission', async () => {
  const role = await Role.findByPk(1, { include: [Permission] });

  if (!role) {
    return;
  }

  const permissions = role.Permissions;
  console.log('permissions', permissions);

  const rolePermission1 = await RolePermission.findAll();
  console.log(
    'rolePermission1',
    rolePermission1.map((item) => {
      return item.toJSON();
    }),
  );

  // 删除角色权限
  await role.setPermissions([]);

  const rolePermission2 = await RolePermission.findAll();
  console.log(
    'rolePermission2',
    rolePermission2.map((item) => {
      return item.toJSON();
    }),
  );

  const permissionList = await Permission.findAll({ include: [Role] });
  console.log('permissionList', permissionList[5].Roles);
});

const role = await Role.findByPk(1, { include: [Permission] });

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
