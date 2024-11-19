/**
 * NextAuth Prisma Adapter (Custom)
 *
 * @see https://github.com/nextauthjs/next-auth/blob/main/packages/adapter-prisma/src/index.ts
 * sobird<i@sobird.me> at 2023/11/29 10:18:40 created.
 */

import prisma from '../../lib/prisma';
import type {
  Adapter, AdapterAccount, AdapterUser, AdapterSession,
} from '@auth/core/adapters';
import type { Prisma } from '@prisma/client';

const AuthAdapter: Adapter = {
  async createUser(data) {
    return prisma.user.create({
      data,
    });
  },
  async getUser(id) {
    return prisma.user.findUnique({
      where: {
        id,
      },
    });
  },
  async getUserByEmail(email) {
    return prisma.user.findUnique({
      where: {
        email,
      },
    });
  },
  async getUserByAccount(provider_providerAccountId) {
    const account = await prisma.account.findUnique({
      where: { provider_providerAccountId },
      select: { user: true },
    });
    return account?.user ?? null;
  },
  async updateUser({ id, ...data }) {
    return prisma.user.update({ where: { id }, data });
  },
  async deleteUser(id) {
    return prisma.user.delete({ where: { id } });
  },
  async linkAccount(data) {
    return prisma.account.create({ data }) as unknown as AdapterAccount;
  },
  async unlinkAccount(provider_providerAccountId) {
    return prisma.account.delete({
      where: { provider_providerAccountId },
    }) as unknown as AdapterAccount;
  },
  async createSession(data) {
    return prisma.session.create({ data });
  },
  async getSessionAndUser(sessionToken) {
    const userAndSession = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });
    if (!userAndSession) return null;
    const { user, ...session } = userAndSession;
    return { user, session } as { user: AdapterUser; session: AdapterSession };
  },
  async updateSession(data) {
    return prisma.session.update({ where: { sessionToken: data.sessionToken }, data });
  },
  async deleteSession(sessionToken) {
    try {
      return await prisma.session.delete({ where: { sessionToken } });
    } catch (error) {
      console.log('error', error);
    }
  },

  /**
   * @test
   * INSERT INTO verification_tokens(identifier,token,expires,created_at,updated_at) VALUES('sobird@126.com','a85ceed90550bdb8e899b3f789330bc4e401e30010dea8e5d514e1e5cf3f0b1c','2023-11-30 00:00:00','2023-11-29 15:42:34','2023-11-29 15:42:36');
   *
   * @param attributes
   * @returns
   */
  async createVerificationToken(data) {
    const verificationToken = await prisma.verificationToken.create({ data });
    // @ts-expect-errors // MongoDB needs an ID, but we don't
    if (verificationToken.id) delete verificationToken.id;
    return verificationToken;
  },
  async useVerificationToken(identifier_token) {
    try {
      const verificationToken = await prisma.verificationToken.delete({
        where: { identifier_token },
      });
      // @ts-expect-errors // MongoDB needs an ID, but we don't
      if (verificationToken.id) delete verificationToken.id;
      return verificationToken;
    } catch (error) {
      // If token already used/deleted, just return null
      // https://www.prisma.io/docs/reference/api-reference/error-reference#p2025
      if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2025') { return null; }
      throw error;
    }
  },
};

export default AuthAdapter;
