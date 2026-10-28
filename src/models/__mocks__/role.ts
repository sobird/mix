import { CreationAttributes } from 'sequelize';

import Role from '../role';

vi.mock('@/lib/sequelize');

const seeds = [
  {
    name: '超级管理员',
    description: '超级管理员角色',
  },
  {
    name: '普通用户',
    description: '普通用户角色',
  },
] as CreationAttributes<Role>[];

await Role.sync({ force: true });
await Role.bulkCreate(seeds, { individualHooks: true, validate: true });

export default Role;
