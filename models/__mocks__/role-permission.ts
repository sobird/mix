import { CreationAttributes } from 'sequelize';

import RolePermission from '@/models/role-permission';

vi.mock('@/lib/sequelize');

const seeds = [
  {
    id: '1',
    username: 'admin',
    email: 'member@casl.io',
  },
  {
    id: '2',
    username: 'member',
    email: 'admin@casl.io',
  },
] as CreationAttributes<RolePermission>[];

await RolePermission.sync({ force: true });
// await RolePermission.bulkCreate(seeds, { individualHooks: true, validate: true });

export default RolePermission;
