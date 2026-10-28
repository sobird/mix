import { CreationAttributes } from 'sequelize';

import UserModel from '@/models/user';

vi.mock('@/lib/sequelize');
vi.mock('../user-role');
vi.mock('../role');

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
] as CreationAttributes<UserModel>[];

await UserModel.sync({ force: true });
await UserModel.bulkCreate(seeds, { individualHooks: true, validate: true });

export default UserModel;
