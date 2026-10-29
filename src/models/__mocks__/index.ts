import { vi } from 'vitest';

import { seedAll } from '../../../tests/helpers/seeds';

/**
 * `vi.mock('@/models')` 的 manual mock。
 *
 * 复用真实的模型实现，并在加载时灌入一整套种子数据，
 * 让 service / action 层的测试可以直接从已知数据开始。
 */
const actual = await vi.importActual<typeof import('../index')>('../index');

export type { Models } from '../index';

export const {
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
  UserMenuPreference,
  UserRole,
  VerificationToken,
  models,
  sequelize,
} = actual;

await seedAll();
