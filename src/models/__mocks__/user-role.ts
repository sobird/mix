// import User from '../user';
import UserRoleModel from '@/models/user-role';

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
] as UserRoleModel[];

console.log('UserRoleModel', UserRoleModel);

await UserRoleModel.sync({ force: true });
await UserRoleModel.bulkCreate(seed, { individualHooks: true, validate: true });

export default UserRoleModel;
