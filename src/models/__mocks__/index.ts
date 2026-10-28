/**
 * Models Index
 *
 * import { models } from '@auth/sequelize-adapter';
 *
 * @see https://github.com/sequelize/sequelize/blob/main/types/test/typescriptDocs/ModelInit.ts
 *
 * sobird<i@sobird.me> at 2021/11/16 20:33:20 created.
 */

vi.mock('@/models/account');
vi.mock('@/models/dictionaryItem');
vi.mock('@/models/dictionaryType');
vi.mock('@/models/group');
vi.mock('@/models/log');
vi.mock('@/models/menu');
vi.mock('@/models/organization');
vi.mock('@/models/permission');
vi.mock('@/models/role-permission');
vi.mock('@/models/role');
vi.mock('@/models/session');
vi.mock('@/models/user-role');
vi.mock('@/models/user');
vi.mock('@/models/verificationToken');

export {
  // eslint-disable-next-line no-restricted-exports
  default,
  sequelize,
  AccountModel,
  UserModel,
  SessionModel,
  VerificationTokenModel,
  RoleModel,
  PermissionModel,
  MenuModel,
  GroupModel,

  RolePermissionModel,
  UserRoleModel,
} from '..';
