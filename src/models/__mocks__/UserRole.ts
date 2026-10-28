import { CreationAttributes } from 'sequelize';

import { UserRole } from '@/models/UserRole';

vi.mock('@/lib/sequelize');
vi.mock('@/models/Role');
vi.mock('@/models/User');

const seed = [
  {
    userId: 1,
    roleId: 1,
  },
  {
    userId: 2,
    roleId: 2,
  },
] as CreationAttributes<UserRole>[];

await UserRole.sync({ force: true });
await UserRole.bulkCreate(seed, { individualHooks: true, validate: true });

export { UserRole };
