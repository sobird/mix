/**
 * Next-Auth Custom Adapter
 *
 * @see https://github.com/nextauthjs/next-auth/tree/main/packages/adapter-sequelize
 *
 * sobird<i@sobird.me> at 2023/11/29 10:18:40 created.
 */

import Account from '@/models/account';
import Session from '@/models/session';
import User from '@/models/user';
import VerificationToken from '@/models/verificationToken';

import type { Adapter, AdapterSession, AdapterUser } from '@auth/core/adapters';

const AuthAdapter: Adapter = {
  async createUser(record) {
    return User.create(record as unknown as User, { raw: true }) as unknown as AdapterUser;
  },
  async getUser(id) {
    const user = await User.findByPk(id);

    return user?.get({ plain: true }) as unknown as AdapterUser ?? null;
  },
  async getUserByEmail(email) {
    const user = await User.findOne({ where: { email } });

    return user?.get({ plain: true }) as unknown as AdapterUser ?? null;
  },
  async getUserByAccount({ providerAccountId, provider }) {
    const account = await Account.findOne({
      where: { provider, providerAccountId },
      raw: true,
    });

    if (!account) {
      return null;
    }

    const user = await User.findByPk(account.userId);

    return user?.get({ plain: true }) as unknown as AdapterUser ?? null;
  },
  async updateUser(record) {
    await User.update(record as unknown as User, { where: { id: record.id } });
    return User.findByPk(record.id, {
      raw: true,
    }) as unknown as AdapterUser;
  },
  async deleteUser(userId) {
    const user = await User.findByPk(userId);
    await User.destroy({ where: { id: userId } });

    return user as unknown as AdapterUser;
  },
  async linkAccount(account) {
    await Account.create(account as unknown as Account);
  },
  async unlinkAccount({ providerAccountId, provider }) {
    await Account.destroy({ where: { provider, providerAccountId } });
  },
  async createSession(record: any) {
    return Session.create(record) as unknown as AdapterSession;
  },
  async getSessionAndUser(sessionToken) {
    const session = await Session.findOne({
      where: { sessionToken },
    });

    if (!session) {
      return null;
    }

    const user = await User.findByPk(session.userId, {
      attributes: ['id', 'username', 'name', 'email'],
    });

    if (!user) {
      return null;
    }

    return {
      session: session.get({ plain: true }) as unknown as AdapterSession,
      user: { ...user.get({ plain: true }), image: 'image' } as unknown as AdapterUser,
    };
  },
  async updateSession({ sessionToken, expires }) {
    await Session.update({ sessionToken, expires }, { where: { sessionToken } });

    return Session.findOne({ where: { sessionToken }, raw: true }) as unknown as AdapterSession;
  },
  async deleteSession(sessionToken) {
    const session = await Session.findOne({ where: { sessionToken }, raw: true });
    if (session) {
      await Session.destroy({ where: { sessionToken } });
      return session.get({ plain: true }) as unknown as AdapterSession;
    }
  },

  /**
   * @test
   * INSERT INTO verification_tokens(identifier,token,expires,created_at,updated_at) VALUES('sobird@126.com','a85ceed90550bdb8e899b3f789330bc4e401e30010dea8e5d514e1e5cf3f0b1c','2023-11-30 00:00:00','2023-11-29 15:42:34','2023-11-29 15:42:36');
   *
   * @param attributes
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
