// @vitest-environment node

import { Session } from '@/models';

import { useInMemoryDatabase } from '../../../tests/helpers/database';
import { createAccount, createSession, createUser } from '../../../tests/helpers/factories';
import adapter from './adapter-sequelize';

useInMemoryDatabase();

describe('getSessionAndUser', () => {
  it('returns the session and user for an active user', async () => {
    const user = await createUser({ username: 'alice' });
    const session = await createSession({ userId: Number(user.id), sessionToken: 'active-token' });

    const result = await adapter.getSessionAndUser!('active-token');

    expect(result?.session.sessionToken).toBe(session.sessionToken);
    expect(result?.user.id).toBe(user.id);
  });

  it('deletes the session and returns null when the user is disabled', async () => {
    const user = await createUser({ username: 'banned', status: false });
    await createSession({ userId: Number(user.id), sessionToken: 'banned-token' });

    const result = await adapter.getSessionAndUser!('banned-token');

    expect(result).toBeNull();
    await expect(Session.count({ where: { sessionToken: 'banned-token' } })).resolves.toBe(0);
  });

  it('returns null when the session does not exist', async () => {
    await expect(adapter.getSessionAndUser!('missing')).resolves.toBeNull();
  });
});

describe('user lookup attribute whitelist', () => {
  it('does not expose password or salt through getUserByEmail', async () => {
    await createUser({ username: 'alice', password: 'secret', email: 'alice@example.com' });

    const user = (await adapter.getUserByEmail!('alice@example.com')) as unknown as Record<string, unknown>;

    expect(user.email).toBe('alice@example.com');
    expect(user.name).toBe('alice');
    expect(user).not.toHaveProperty('password');
    expect(user).not.toHaveProperty('salt');
  });

  it('does not expose password or salt through getUserByAccount', async () => {
    const user = await createUser({ username: 'alice', password: 'secret' });
    await createAccount({ userId: Number(user.id), provider: 'github', providerAccountId: 'gh-1' });

    const found = (await adapter.getUserByAccount!({
      provider: 'github',
      providerAccountId: 'gh-1',
    })) as unknown as Record<string, unknown>;

    expect(found.id).toBe(user.id);
    expect(found).not.toHaveProperty('password');
    expect(found).not.toHaveProperty('salt');
  });
});

describe('createUser username uniqueness', () => {
  /** next-auth 调用 createUser 时不带 id，但 Adapter 类型要求，用 create 辅助保持测试意图清晰 */
  function createOAuthUser(record: { name?: string; email: string }) {
    return adapter.createUser!(
      record as unknown as Parameters<NonNullable<typeof adapter.createUser>>[0],
    ) as unknown as Promise<{
      username?: string;
      email: string;
    }>;
  }

  it('keeps the display name when it is free', async () => {
    const created = await createOAuthUser({ name: 'bob', email: 'bob@example.com' });

    expect(created).toMatchObject({ username: 'bob', email: 'bob@example.com' });
  });

  it('derives a unique username when the display name is taken', async () => {
    await createUser({ username: 'alice' });

    const created = await createOAuthUser({ name: 'alice', email: 'alice@other.example.com' });

    expect(created.username).not.toBe('alice');
    expect(created.username).toMatch(/^alice/);
  });

  it('falls back to the email local part when the profile has no name', async () => {
    const created = await createOAuthUser({ email: 'carol@example.com' });

    expect(created.username).toMatch(/^carol/);
  });
});
