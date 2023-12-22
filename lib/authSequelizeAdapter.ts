/**
 * Custom Adapter
 *
 * sobird<i@sobird.me> at 2023/11/29 10:18:40 created.
 */

import type { Adapter } from '@auth/core/adapters';
import User from '@/models/user';
import VerificationToken from '@/models/verificationToken';
import Account from '@/models/account';
import Session from '@/models/session';

const USER_ATTRIBUTES_DISPLAY = ['id', 'username', 'email', 'nickname', 'realname'];

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
    });
  },
  async updateUser(record) {
    console.log('record', record);

    await User.update(record, { where: { id: record.id } });
    const user = await User.findByPk(record.id, {
      attributes: USER_ATTRIBUTES_DISPLAY,
    });
    return user!.get({ plain: true });
  },
  async deleteUser(userId) {
    await User.findByPk(userId);
    await User.destroy({ where: { id: userId } });
  },
  async linkAccount(account) {
    await Account.create(account);
  },
  async unlinkAccount({ providerAccountId, provider }) {
    await Account.destroy({
      where: { provider, providerAccountId },
    });
  },
  async createSession(record) {
    const session = await Session.create(record);
    return session?.get({ plain: true }) ?? null;
  },
  async getSessionAndUser(sessionToken) {
    const session = await Session.findOne({
      where: { sessionToken },
    });

    if (!session) {
      return null;
    }

    const user = await User.findByPk(session.userId, {
      attributes: USER_ATTRIBUTES_DISPLAY,
    });

    if (!user) {
      return null;
    }

    return {
      session: session?.get({ plain: true }),
      user: user?.get({ plain: true }),
    };
  },
  async updateSession({ sessionToken, expires }) {
    await Session.update(
      { sessionToken, expires },
      { where: { sessionToken } },
    );

    const session = await Session.findOne({ where: { sessionToken } });

    return session?.get({ plain: true }) ?? null;
  },
  async deleteSession(sessionToken) {
    const session = await Session.findOne({ where: { sessionToken } });
    await Session.destroy({ where: { sessionToken } });
    return session?.get({ plain: true });
  },

  /**
   * @test
   * INSERT INTO verification_tokens(identifier,token,expires,created_at,updated_at) VALUES('sobird@126.com','a85ceed90550bdb8e899b3f789330bc4e401e30010dea8e5d514e1e5cf3f0b1c','2023-11-30 00:00:00','2023-11-29 15:42:34','2023-11-29 15:42:36');
   *
   * @param attributes
   * @returns
   */
  async createVerificationToken(attributes) {
    return VerificationToken.create(attributes) as any;
  },
  async useVerificationToken({ identifier, token }) {
    const tokenInstance = await VerificationToken.findOne({
      where: { identifier, token },
    });

    await VerificationToken.destroy({ where: { identifier } });

    return tokenInstance?.get({ plain: true }) ?? null;
  },
};

export default AuthAdapter;
