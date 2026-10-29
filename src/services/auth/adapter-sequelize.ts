/**
 * Next-Auth Custom Adapter
 *
 * @see https://github.com/nextauthjs/next-auth/tree/main/packages/adapter-sequelize
 *
 * sobird<i@sobird.me> at 2023/11/29 10:18:40 created.
 */

import { randomBytes } from 'node:crypto';

import type { Adapter, AdapterSession, AdapterUser } from '@auth/core/adapters';

import { Account } from '@/models/Account';
import type { AccountCreationAttributes } from '@/models/Account';
import { Session } from '@/models/Session';
import { User } from '@/models/User';
import type { UserCreationAttributes } from '@/models/User';
import { VerificationToken } from '@/models/VerificationToken';
import RoleService from '@/services/role';

// declare module '@auth/core/adapters' {
//   interface AdapterUser {
//     id: number
//   }
// }

/** users.username 为 STRING(32) 且唯一 */
const USERNAME_MAX_LENGTH = 32;
/** users 表查询时排除的隐私字段（next-auth 只需要身份信息） */
const PRIVATE_ATTRIBUTES = ['password', 'salt'];

/**
 * OAuth/Email 首次登录时生成唯一用户名。
 *
 * `name` 是第三方显示名，可能为空或与他人重名；先做字符过滤再探测占用，
 * 冲突时追加随机后缀。软删除的行仍占用唯一索引，因此查询时包含已删除记录。
 */
async function resolveUsername(record: { name?: string | null; email?: string }): Promise<string> {
  const source = record.name?.trim() || record.email?.split('@')[0] || 'user';
  const base = source.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, USERNAME_MAX_LENGTH) || 'user';

  // 一次生成候选并单次查询，避免在循环里逐个探测（也避免 await-in-loop）
  const candidates = [base];
  for (let attempt = 0; attempt < 5; attempt += 1) {
    candidates.push(`${base.slice(0, USERNAME_MAX_LENGTH - 7)}_${randomBytes(3).toString('hex')}`);
  }

  const takenRows = await User.findAll({
    where: { username: candidates },
    attributes: ['username'],
    paranoid: false,
  });
  const taken = new Set(takenRows.map((row) => row.username));

  return (
    candidates.find((candidate) => !taken.has(candidate)) ??
    `${base.slice(0, USERNAME_MAX_LENGTH - 9)}_${randomBytes(4).toString('hex')}`
  );
}

const AuthAdapter: Adapter = {
  async createUser(record) {
    const created = await User.create({
      ...record,
      username: await resolveUsername(record),
    } as unknown as UserCreationAttributes);

    await RoleService.assignDefaultRole(created.id);

    return created as unknown as AdapterUser;
  },
  async getUser(id) {
    const user = await User.findByPk(id);
    return (user?.get({ plain: true }) ?? null) as unknown as AdapterUser | null;
  },
  async getUserByEmail(email) {
    const user = await User.findOne({ where: { email }, attributes: { exclude: PRIVATE_ATTRIBUTES } });
    return (user?.get({ plain: true }) ?? null) as unknown as AdapterUser | null;
  },
  async getUserByAccount({ providerAccountId, provider }) {
    const account = await Account.findOne({ where: { provider, providerAccountId } });

    if (!account) {
      return null;
    }

    const user = await User.findByPk(account.userId, { attributes: { exclude: PRIVATE_ATTRIBUTES } });

    return (user?.get({ plain: true }) ?? null) as unknown as AdapterUser | null;
  },
  async updateUser(record) {
    await User.update({ ...record, username: record.name } as unknown as UserCreationAttributes, {
      where: { id: record.id as unknown as number },
      individualHooks: true,
    });
    return User.findByPk(record.id) as unknown as AdapterUser;
  },
  async deleteUser(userId) {
    const user = await User.findByPk(userId);
    await User.destroy({ where: { id: userId } });
    return user as unknown as AdapterUser | null;
  },
  async linkAccount(account) {
    await Account.create(account as unknown as AccountCreationAttributes);
  },
  async unlinkAccount({ providerAccountId, provider }) {
    await Account.destroy({ where: { provider, providerAccountId } });
  },
  async createSession(record: any) {
    return Session.create(record) as unknown as Promise<AdapterSession>;
  },
  async getSessionAndUser(sessionToken) {
    const session = await Session.findOne({
      where: { sessionToken },
    });

    if (!session) {
      return null;
    }

    const user = await User.findByPk(session.userId, {
      attributes: ['id', 'username', 'name', 'email', 'image', 'status'],
    });

    // 封禁即踢：删除存量会话，session 路由会随之清除 cookie
    if (!user || !user.status) {
      await Session.destroy({ where: { sessionToken } });
      return null;
    }

    return {
      session: session.get({ plain: true }),
      user: { ...user.get({ plain: true }) },
    } as unknown as { session: AdapterSession; user: AdapterUser };
  },
  async updateSession({ sessionToken, expires }) {
    await Session.update({ sessionToken, expires }, { where: { sessionToken } });
    return (await Session.findOne({ where: { sessionToken } })) as unknown as AdapterSession | null;
  },
  async deleteSession(sessionToken) {
    const session = await Session.findOne({ where: { sessionToken }, raw: true });
    if (session) {
      await Session.destroy({ where: { sessionToken } });
      return session as unknown as AdapterSession;
    }
  },

  /**
   * @test
   * INSERT INTO verification_tokens(identifier,token,expires,created_at,updated_at) VALUES('sobird@126.com','a85ceed90550bdb8e899b3f789330bc4e401e30010dea8e5d514e1e5cf3f0b1c','2023-11-30 00:00:00','2023-11-29 15:42:34','2023-11-29 15:42:36');
   *
   * @param verificationToken
   * @returns
   */
  async createVerificationToken(verificationToken) {
    return VerificationToken.create(verificationToken);
  },
  async useVerificationToken({ identifier, token }) {
    const verificationToken = await VerificationToken.findOne({
      where: { identifier, token },
    });
    await VerificationToken.destroy({ where: { identifier } });

    return verificationToken?.get({ plain: true }) ?? null;
  },
};

export default AuthAdapter;
