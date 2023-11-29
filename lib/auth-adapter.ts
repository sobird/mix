/**
 * Custom Adapter
 *
 * sobird<i@sobird.me> at 2023/11/29 10:18:40 created.
 */

import type { Adapter } from '@auth/core/adapters';

export function AuthAdapter(client, options = {}): Adapter {
  return {
    async createUser(user) {

    },
    async getUser(id) {

    },
    async getUserByEmail(email) {

    },
    async getUserByAccount({ providerAccountId, provider }) {

    },
    async updateUser(user) {

    },
    async deleteUser(userId) {

    },
    async linkAccount(account) {

    },
    async unlinkAccount({ providerAccountId, provider }) {

    },
    async createSession({ sessionToken, userId, expires }) {

    },
    async getSessionAndUser(sessionToken) {

    },
    async updateSession({ sessionToken }) {

    },
    async deleteSession(sessionToken) {

    },
    async createVerificationToken({ identifier, expires, token }) {

    },
    async useVerificationToken({ identifier, token }) {

    },
  };
}
