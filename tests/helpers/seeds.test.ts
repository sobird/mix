// @vitest-environment node

import {
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
} from '@/models';

import { useInMemoryDatabase } from './database';
import { DEFAULT_PASSWORD, seedAll } from './seeds';

useInMemoryDatabase();

describe('seed helpers', () => {
  it('seeds every model with sample data', async () => {
    const seeded = await seedAll();

    expect(seeded.users.admin.email).toBe('admin@mix.local');
    expect(seeded.users.admin.verifyPassword(DEFAULT_PASSWORD)).toBe(true);
    expect(seeded.roles.admin.name).toBe('管理员');

    expect(await User.count()).toBe(2);
    expect(await Role.count()).toBe(4);
    expect(await Permission.count()).toBe(3);
    expect(await RolePermission.count()).toBe(3);
    expect(await UserRole.count()).toBe(2);
    expect(await Account.count()).toBe(1);
    expect(await Session.count()).toBe(1);
    expect(await Menu.count()).toBe(2);
    expect(await Group.count()).toBe(2);
    expect(await DictionaryType.count()).toBe(1);
    expect(await DictionaryItem.count()).toBe(2);
    expect(await Log.count()).toBe(1);
    expect(await Organization.count()).toBe(1);
    expect(await VerificationToken.count()).toBe(1);
  });

  it('is idempotent', async () => {
    await seedAll();
    const counts = await Promise.all([User.count(), Role.count(), Permission.count(), Menu.count()]);

    await seedAll();

    expect(await Promise.all([User.count(), Role.count(), Permission.count(), Menu.count()])).toEqual(counts);
  });
});
