import { CreationAttributes } from 'sequelize';

import { UserRole } from '@/models/user-role';

vi.mock('@/lib/sequelize');
vi.mock('@/models/role');
vi.mock('@/models/user');

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
