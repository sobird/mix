import { CreationAttributes } from 'sequelize';

import Permission from '@/models/permission';

vi.mock('@/lib/sequelize');

const seeds = [
  {
    name: '查看用户',
    description: '查看用户',
    action: 'read',
    subject: 'User',
  },
  {
    name: '更新用户',
    description: '更新用户',
    action: 'update',
    subject: 'User',
  },
] as CreationAttributes<Permission>[];

await Permission.sync({ force: true });
await Permission.bulkCreate(seeds, { individualHooks: true, validate: true });

export default Permission;
