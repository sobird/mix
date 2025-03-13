import { CreationAttributes } from 'sequelize';

import Permission from '@/models/permission';

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
] as CreationAttributes<Permission>[];

await Permission.sync({ force: true });
// await Permission.bulkCreate(seeds, { individualHooks: true, validate: true });

export default Permission;
