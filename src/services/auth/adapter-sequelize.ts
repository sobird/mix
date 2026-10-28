/**
 * Next-Auth Custom Adapter
 *
 * @see https://github.com/nextauthjs/next-auth/tree/main/packages/adapter-sequelize
 *
 * sobird<i@sobird.me> at 2023/11/29 10:18:40 created.
 */

import type { Adapter, AdapterSession, AdapterUser } from '@auth/core/adapters';

import { Account } from '@/models/Account';
import type { AccountCreationAttributes } from '@/models/Account';
import { Session } from '@/models/Session';
import { User } from '@/models/User';
import type { UserCreationAttributes } from '@/models/User';
import { VerificationToken } from '@/models/VerificationToken';

// declare module '@auth/core/adapters' {
//   interface AdapterUser {
//     id: number
//   }
// }

const AuthAdapter: Adapter = {
  async createUser(record) {
    return User.create({
      ...record,
      username: record.name,
    } as unknown as UserCreationAttributes) as unknown as AdapterUser;
  },
  async getUser(id) {
    const user = await User.findByPk(id);
    return (user?.get({ plain: true }) ?? null) as unknown as AdapterUser | null;
  },
  async getUserByEmail(email) {
    const user = await User.findOne({ where: { email } });
    return (user?.get({ plain: true }) ?? null) as unknown as AdapterUser | null;
  },
  async getUserByAccount({ providerAccountId, provider }) {
    const account = await Account.findOne({ where: { provider, providerAccountId } });

    if (!account) {
      return null;
    }

    const user = await User.findByPk(account.userId);

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
      attributes: ['id', 'username', 'name', 'email', 'image'],
    });

    if (!user) {
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
