/**
 * Next-Auth Custom Adapter
 *
 * sobird<i@sobird.me> at 2023/11/29 10:18:40 created.
 */

import Account from '@/models/account';
import Session from '@/models/session';
import User from '@/models/user';
import VerificationToken from '@/models/verificationToken';

import type { Adapter } from '@auth/core/adapters';

const AuthAdapter: Adapter = {
  async createUser(record) {
    return User.create(record, { raw: true }) as any;
  },
  async getUser(id) {
    return User.findByPk(id, {
      raw: true,
    }) as any;
  },
  async getUserByEmail(email) {
    return User.findOne({
      where: { email },
      raw: true,
    }) as any;
  },
  async getUserByAccount({ providerAccountId, provider }) {
    const account = await Account.findOne({
      where: { provider, providerAccountId },
      raw: true,
    });

    if (!account) {
      return null;
    }

    return User.findByPk(account.userId, {
      raw: true,
    }) as any;
  },
  async updateUser(record) {
    await User.update(record as unknown as User, { where: { id: record.id } });
    return User.findByPk(record.id, {
      raw: true,
    }) as any;
  },
  async deleteUser(userId) {
    await User.findByPk(userId);
    await User.destroy({ where: { id: userId } });
  },
  async linkAccount(account: any) {
    await Account.create(account);
  },
  async unlinkAccount({ providerAccountId, provider }) {
    await Account.destroy({
      where: { provider, providerAccountId },
    });
  },
  async createSession(record: any) {
    return Session.create(record, {
      raw: true,
    }) as any;
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
      session: session?.get({ plain: true }) as any,
      user: {
        ...user.get(),
        image: 'image',
      } as any,
    };
  },
  async updateSession({ sessionToken, expires }) {
    await Session.update(
      { sessionToken, expires },
      { where: { sessionToken } },
    );

    return Session.findOne({ where: { sessionToken }, raw: true }) as any;
  },
  async deleteSession(sessionToken) {
    const session = await Session.findOne({ where: { sessionToken }, raw: true });
    if (session) {
      await Session.destroy({ where: { sessionToken } });
    }
    return session as any;
  },

  /**
   * @test
   * INSERT INTO verification_tokens(identifier,token,expires,created_at,updated_at) VALUES('sobird@126.com','a85ceed90550bdb8e899b3f789330bc4e401e30010dea8e5d514e1e5cf3f0b1c','2023-11-30 00:00:00','2023-11-29 15:42:34','2023-11-29 15:42:36');
   *
   * @param attributes
   * @returns
   */
  async createVerificationToken(attributes) {
    return VerificationToken.create(attributes, { raw: true });
  },
  async useVerificationToken({ identifier, token }) {
    const verificationToken = await VerificationToken.findOne({
      where: { identifier, token },
      raw: true,
    });

    await VerificationToken.destroy({ where: { identifier } });

    return verificationToken;
  },
};

export default AuthAdapter;
