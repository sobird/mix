// @vitest-environment node

import { Role } from '@/models/Role';
import { User } from '@/models/User';

import { DEFAULT_PASSWORD } from './seeds';

vi.mock('@/models/Role');
vi.mock('@/models/User');

describe('model manual mocks', () => {
  it('re-exports the real model classes', async () => {
    const [actualUser, actualRole] = await Promise.all([
      vi.importActual<typeof import('@/models/User')>('@/models/User'),
      vi.importActual<typeof import('@/models/Role')>('@/models/Role'),
    ]);

    expect(User).toBe(actualUser.User);
    expect(Role).toBe(actualRole.Role);
  });

  it('exposes seed helpers that populate sample data', async () => {
    const userModule = await import('@/models/User');
    const roleModule = await import('@/models/Role');

    await (userModule as any).seed();
    await (roleModule as any).seed();

    expect(await User.count()).toBe(2);
    expect(await Role.count()).toBe(4);

    const admin = await User.findOne({ where: { username: 'admin' } });
    expect(admin?.verifyPassword(DEFAULT_PASSWORD)).toBe(true);
  });
});
