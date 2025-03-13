import { UserModel } from '@/models';

vi.mock('@/models');

const rows = await UserModel.findAll({ include: [UserModel.associations.Roles] });
console.log('rows', rows[0].Roles[0].get());
