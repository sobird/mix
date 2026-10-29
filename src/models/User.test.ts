// @vitest-environment node

import { UniqueConstraintError, ValidationError } from 'sequelize';

import { sequelize, Account, Role, Session, User, UserRole } from '@/models';

import { useInMemoryDatabase } from '../../tests/helpers/database';
import { createRole, createUser } from '../../tests/helpers/factories';
import { DEFAULT_PASSWORD } from '../../tests/helpers/seeds';

useInMemoryDatabase();

describe('User model', () => {
  describe('defaults', () => {
    it('runs against an in-memory database', () => {
      expect((sequelize as unknown as { options: { storage: string } }).options.storage).toBe(':memory:');
    });

    it('applies column defaults', async () => {
      const user = await createUser();

      expect(user.id).toBeGreaterThan(0);
      expect(user.status).toBe(true);
      expect(user.ip).toBe(0);
      expect(user.salt).toMatch(/^[0-9a-f]{32}$/);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('exposes username through the virtual name attribute', async () => {
      const user = await createUser({ username: 'virtual-name' });

      expect(user.name).toBe('virtual-name');
    });
  });

  describe('validation', () => {
    it('requires an email', async () => {
      await expect(User.create({ username: 'no-email', email: null } as never)).rejects.toBeInstanceOf(ValidationError);
    });

    it('allows a null username', async () => {
      const user = await User.create({ username: null, email: 'null@example.com' });

      expect(user.username).toBeNull();
    });

    it('rejects a duplicated username', async () => {
      await createUser({ username: 'duplicated' });

      await expect(createUser({ username: 'duplicated' })).rejects.toBeInstanceOf(UniqueConstraintError);
    });

    it('does not restrict gender values (SQLite does not enforce ENUM)', async () => {
      const user = await createUser({ gender: 'other' });

      expect(user.gender).toBe('other');
    });
  });

  describe('password hashing', () => {
    it('hashes deterministically with the given salt', () => {
      const first = User.hashPassword('secret', 'salt-a');
      const second = User.hashPassword('secret', 'salt-a');

      expect(first).toBe(second);
      expect(first).toMatch(/^[0-9a-f]{64}$/);
    });

    it('produces different hashes for different salts', () => {
      expect(User.hashPassword('secret', 'salt-a')).not.toBe(User.hashPassword('secret', 'salt-b'));
    });

    it('hashes the password before create', async () => {
      const user = await createUser({ password: 'secret' });

      expect(user.password).not.toBe('secret');
      expect(user.password).toHaveLength(64);
      expect(user.verifyPassword('secret')).toBe(true);
      expect(user.verifyPassword('wrong')).toBe(false);
    });

    it('keeps the password untouched when saving other fields', async () => {
      const user = await createUser({ password: 'secret' });
      const originalHash = user.password;

      user.set('nickname', '新的昵称');
      await user.save();

      expect(user.password).toBe(originalHash);
      expect(user.verifyPassword('secret')).toBe(true);
    });

    it('re-hashes the password when it changes', async () => {
      const user = await createUser({ password: 'secret' });

      user.password = 'new-secret';
      await user.save();

      expect(user.verifyPassword('new-secret')).toBe(true);
      expect(user.verifyPassword('secret')).toBe(false);
    });
  });

  describe('signUp', () => {
    it('creates a user and marks the email verified', async () => {
      const [user, created] = (await User.signUp({
        username: 'signup',
        password: 'secret',
        email: 'signup@example.com',
      })) as [User, boolean];

      expect(created).toBe(true);
      expect(user.emailVerified).toBeInstanceOf(Date);
      expect(user.password).toHaveLength(64);
    });

    it('returns the existing user when the username already exists', async () => {
      const [first] = (await User.signUp({
        username: 'signup',
        password: 'secret',
        email: 'a@example.com',
      })) as [User, boolean];
      const [second, created] = (await User.signUp({
        username: 'signup',
        password: 'other',
        email: 'b@example.com',
      })) as [User, boolean];

      expect(created).toBe(false);
      expect(second.id).toBe(first.id);
    });

    it('returns the existing user when the email already exists', async () => {
      const [first] = (await User.signUp({
        username: 'first',
        password: 'secret',
        email: 'same@example.com',
      })) as [User, boolean];
      const [second, created] = (await User.signUp({
        username: 'second',
        password: 'secret',
        email: 'same@example.com',
      })) as [User, boolean];

      expect(created).toBe(false);
      expect(second.id).toBe(first.id);
    });
  });

  describe('signin', () => {
    async function createActiveUser(overrides = {}) {
      return createUser({
        username: 'signin-user',
        email: 'signin@example.com',
        password: 'secret',
        ...overrides,
      });
    }

    it('rejects empty credentials', async () => {
      await expect(User.signin({ username: '', password: 'secret' })).rejects.toThrow('用户名和密码不能为空');
      await expect(User.signin({ username: 'name', password: '' })).rejects.toThrow('用户名和密码不能为空');
    });

    it('rejects an unknown user', async () => {
      await expect(User.signin({ username: 'nobody', password: 'secret' })).rejects.toThrow('用户不存在');
    });

    it('rejects a disabled user', async () => {
      await createActiveUser({ status: false });

      await expect(User.signin({ username: 'signin-user', password: 'secret' })).rejects.toThrow('用户已被禁用');
    });

    it('rejects a wrong password', async () => {
      await createActiveUser();

      await expect(User.signin({ username: 'signin-user', password: 'wrong' })).rejects.toThrow('密码不正确');
    });

    it('returns a sanitized user on success', async () => {
      await createActiveUser();

      const result = await User.signin({ username: 'signin-user', password: 'secret' });

      expect(result.username).toBe('signin-user');
      expect(result.email).toBe('signin@example.com');
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('salt');
      expect(result).not.toHaveProperty('emailVerified');
    });

    it('accepts the seeded default password', async () => {
      const { admin } = await import('../../tests/helpers/seeds').then((helpers) => helpers.seedUsers());

      const result = await User.signin({ username: admin.username, password: DEFAULT_PASSWORD });

      expect(result.id).toBe(admin.id);
    });
  });

  describe('soft delete', () => {
    it('hides destroyed rows by default and restores them', async () => {
      const user = await createUser();

      await user.destroy();

      expect(await User.findByPk(user.id)).toBeNull();
      expect(await User.count()).toBe(0);

      const deleted = await User.findByPk(user.id, { paranoid: false });
      expect((deleted as unknown as { deletedAt: Date }).deletedAt).toBeInstanceOf(Date);

      await deleted?.restore();
      expect(await User.findByPk(user.id)).not.toBeNull();
    });

    it('keeps the unique username occupied after a soft delete', async () => {
      const user = await createUser({ username: 'kept-unique' });

      await user.destroy();

      await expect(createUser({ username: 'kept-unique' })).rejects.toBeInstanceOf(UniqueConstraintError);
    });
  });

  describe('associations', () => {
    it('links roles through UserRole', async () => {
      const user = await createUser();
      const role = await createRole();

      await user.addRole(role);

      const fresh = await User.findByPk(user.id, { include: [Role] });
      expect(fresh?.Roles.map((item) => item.id)).toEqual([role.id]);
      expect(await role.countUsers()).toBe(1);
      expect(await UserRole.count()).toBe(1);
    });

    it('has many accounts and sessions', async () => {
      const user = await createUser();

      const account = await user.createAccount({
        type: 'credentials' as never,
        provider: 'credentials',
        providerAccountId: 'user-id',
        userId: user.id,
      });
      const session = await user.createSession({
        expires: new Date('2099-01-01T00:00:00.000Z'),
        sessionToken: 'token',
        userId: user.id,
      });

      expect(account.userId).toBe(user.id);
      expect(session.userId).toBe(user.id);

      const fresh = await User.findByPk(user.id, { include: [Account, Session] });
      expect(fresh?.Accounts).toHaveLength(1);
      expect(fresh?.Sessions).toHaveLength(1);
    });
  });
});
