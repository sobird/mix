import { CreationAttributes } from 'sequelize';

import User from '../user';

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
] as CreationAttributes<User>[];

await User.sync({ force: true });
await User.bulkCreate(seeds, { individualHooks: true, validate: true });

export default User;
