/**
 * Models Index
 *
 * import { models } from '@auth/sequelize-adapter';
 *
 * @see https://github.com/sequelize/sequelize/blob/main/types/test/typescriptDocs/ModelInit.ts
 *
 * sobird<i@sobird.me> at 2021/11/16 20:33:20 created.
 */

vi.mock('@/models/Account');
vi.mock('@/models/DictionaryItem');
vi.mock('@/models/DictionaryType');
vi.mock('@/models/Group');
vi.mock('@/models/Log');
vi.mock('@/models/Menu');
vi.mock('@/models/Organization');
vi.mock('@/models/Permission');
vi.mock('@/models/RolePermission');
vi.mock('@/models/Role');
vi.mock('@/models/Session');
vi.mock('@/models/UserRole');
vi.mock('@/models/User');
vi.mock('@/models/VerificationToken');

export {
  sequelize,
  models,
  Account,
  DictionaryItem,
  DictionaryType,
  Group,
  Log,
  Menu,
  Organization,
  Permission,
  Role,
  RolePermission,
  Session,
  User,
  UserRole,
  VerificationToken,
} from '..';
