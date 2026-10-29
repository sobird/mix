import { Session } from '@/models/Session';

import { useInMemoryDatabase } from '../../../tests/helpers/database';
import { createSession, createUser } from '../../../tests/helpers/factories';
import { authOptions } from './index';

useInMemoryDatabase();

const signInCallback = authOptions.callbacks!.signIn!;
const jwtCallback = authOptions.callbacks!.jwt!;
// next-auth 把用户传入的选项挂在 provider.options 上，实际使用的是 options.authorize
const authorize = (
  authOptions.providers[0] as unknown as {
    options: { authorize: (credentials: Record<string, string>) => Promise<unknown> };
  }
).options.authorize;

describe('signIn callback', () => {
  it('rejects users whose status is 0', async () => {
    const allowed = await signInCallback({ user: { status: 0 } } as any);

    expect(allowed).toBe(false);
  });

  it('allows users with status 1', async () => {
    const allowed = await signInCallback({ user: { status: 1 } } as any);

    expect(allowed).toBe(true);
  });

  it('allows first-time OAuth users that have no status yet', async () => {
    const allowed = await signInCallback({ user: undefined } as any);

    expect(allowed).toBe(true);
  });
});

describe('credentials authorize', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the user id as a string on success', async () => {
    const user = await createUser({ username: 'alice', password: 'secret' });

    const result = (await authorize({ username: 'alice', password: 'secret' })) as { id: unknown };

    expect(result.id).toBe(String(user.id));
  });

  it('hides the real reason when the user does not exist', async () => {
    await expect(authorize({ username: 'ghost', password: 'secret' })).rejects.toThrow('用户名或密码错误');
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('用户不存在'));
  });

  it('hides the real reason when the password is wrong', async () => {
    await createUser({ username: 'alice', password: 'secret' });

    await expect(authorize({ username: 'alice', password: 'wrong' })).rejects.toThrow('用户名或密码错误');
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('密码不正确'));
  });

  it('keeps a dedicated message for disabled accounts', async () => {
    await createUser({ username: 'banned', password: 'secret', status: false });

    await expect(authorize({ username: 'banned', password: 'secret' })).rejects.toThrow('账号已被禁用');
  });
});

describe('jwt callback credentials bridge', () => {
  it('clears the user old sessions before creating a new one', async () => {
    const user = await createUser();
    const other = await createUser();
    const oldSession = await createSession({ userId: Number(user.id), sessionToken: 'old-session' });
    const untouched = await createSession({ userId: Number(other.id), sessionToken: 'other-session' });

    await jwtCallback({
      token: {},
      user: { id: user.id },
      account: { type: 'credentials', provider: 'credentials' },
      trigger: 'signIn',
    } as any);

    const remaining = await Session.findAll({ where: { userId: Number(user.id) } });

    expect(remaining).toHaveLength(1);
    expect(remaining[0].sessionToken).not.toBe(oldSession.sessionToken);
    expect(remaining[0].sessionToken).toMatch(/^[0-9a-f-]{36}$/);
    await expect(Session.findByPk(untouched.id)).resolves.not.toBeNull();
  });

  it('does not create database sessions for OAuth accounts', async () => {
    const user = await createUser();

    await jwtCallback({
      token: {},
      user: { id: user.id },
      account: { type: 'oauth', provider: 'github' },
      trigger: 'signIn',
    } as any);

    await expect(Session.count({ where: { userId: Number(user.id) } })).resolves.toBe(0);
  });
});
