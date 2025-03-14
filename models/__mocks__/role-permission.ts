import { CreationAttributes } from 'sequelize';

import RolePermission from '@/models/role-permission';

vi.mock('@/lib/sequelize');

const seeds = [
  {
    roleId: 1,
    permissionId: 1,
  },
  {
    roleId: 1,
    permissionId: 2,
  },
  {
    roleId: 2,
    permissionId: 2,
  },
] as CreationAttributes<RolePermission>[];

await RolePermission.sync({ force: true });
await RolePermission.bulkCreate(seeds, { individualHooks: true, validate: true });

export default RolePermission;
