/**
 * Next-Auth Config
 * SignJWT
 * {
 *   iss: "12", // JWT Issuer: 签发人
 *   exp: 123, // JWT Expiration Time: 过期时间
 *   sub: "", // JWT Subject: 主题
 *   aud: "", // JWT Audience: 受众
 *   nbf: 123, // JWT Not Before: 生效时间
 *   iat: 123, // JWT Issued At: 签发时间
 *   jti: "string", // JWT ID: 编号
 * }
 *
 * @see https://authjs.dev/getting-started/typescript#module-augmentation
 * @see https://github.com/nextauthjs/next-auth/blob/main/packages/core/src/lib/init.ts
 * @see https://github.com/nextauthjs/next-auth/discussions/4394
 * @see https://remaster.com/blog/next-auth-jwt-session
 *
 * sobird<i@sobird.me> at 2023/11/28 21:14:31 created.
 */

/* eslint-disable no-param-reassign */
import { randomUUID } from 'node:crypto';

import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next';
import { cookies } from 'next/headers';
import NextAuth, { getServerSession, type AuthOptions } from 'next-auth';
import { encode, getToken } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/email';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { getCsrfToken } from 'next-auth/react';

import User from '@/models/user';

import adapter from './adapter-sequelize';
import { sendVerificationRequest } from '../mailer';

// const cookiesOptions: Partial<CookiesOptions> = {
//   sessionToken: {
//     name: 'next-auth.session-token',
//     options: {
//       httpOnly: true,
//       sameSite: 'none',
//       path: '/',
//       domain: process.env.NEXT_PUBLIC_DOMAIN,
//       secure: true,
//     },
//   },
//   callbackUrl: {
//     name: 'next-auth.callback-url',
//     options: {

//     },
//   },
//   csrfToken: {
//     name: 'next-auth.csrf-token',
//     options: {

//     },
//   },
// };

const sessionOptions: AuthOptions['session'] = {
  strategy: 'jwt', // default: database
  maxAge: 30 * 24 * 60 * 60, // 30 days
  updateAge: 24 * 60 * 60, // 24 hours
  generateSessionToken: randomUUID,
};

const jwtOptions = {
  async encode(params: any) {
    return params.token?.sessionToken ?? encode(params);
  },
};

export const authOptions: AuthOptions = {
  session: sessionOptions,
  jwt: jwtOptions,
  adapter,
  // cookies: {},
  providers: [
    /**
     * https://next-auth.js.org/configuration/providers/credentials
     *
     * NOTE
     *
     * The Credentials provider can only be used if JSON Web Tokens are enabled for sessions.
     * Users authenticated with the Credentials provider are not persisted in the database.
     */
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: {
          label: '用户',
          type: 'text',
          value: 'sobird',
          placeholder: '请输入用户名',
        },
        password: { label: '密码', type: 'password', value: '' },
      },
      async authorize(credentials) {
        const { username, password } = credentials || {};

        if (!username || !password) {
          return null;
        }

        try {
          const user = await User.signin({ username, password });
          return {
            name: user.username,
            email: user.email,
            id: user.id,
            image: user.image,
            // role: 'manage',
          };
        } catch (e) {
          throw Error(e);
        }
      },
    }),
    GithubProvider({
      clientId: process.env.AUTH_GITHUB_ID || '',
      clientSecret: process.env.AUTH_GITHUB_SECRET || '',
    }),
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID || '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET || '',
    }),
    /**
     * The Email authentication provider can only be used if a database is configured.
     * This is required to store the verification token. Please see the email provider for more details.
     */
    EmailProvider({
      // server: {
      //   host: process.env.EMAIL_SERVER_HOST,
      //   port: process.env.EMAIL_SERVER_PORT,
      //   auth: {
      //     user: process.env.EMAIL_SERVER_USER,
      //     pass: process.env.EMAIL_SERVER_PASS,
      //   },
      // },
      // from: process.env.EMAIL_FROM,
      // maxAge: process.env.EMAIL_MAX_AGE,
      sendVerificationRequest,
      // async generateVerificationToken() {
      //   return 'ABC123';
      // },
    }),
  ],

  // export const defaultCallbacks: CallbacksOptions = {
  //   signIn() {
  //     return true
  //   },
  //   redirect({ url, baseUrl }) {
  //     if (url.startsWith("/")) return `${baseUrl}${url}`
  //     else if (new URL(url).origin === baseUrl) return url
  //     return baseUrl
  //   },
  //   session({ session }) {
  //     return session
  //   },
  //   jwt({ token }) {
  //     return token
  //   },
  // }
  callbacks: {
    async signIn(/* {user, account, profile, email, credentials,} */) {
      return true;
    },

    async jwt({
      token, trigger, session, user, account,
    }) {
      console.log('jwt-callback', token, user, account);
      if (trigger === 'update') {
        token.name = session.user.name;
      }
      if (user) {
        token.id = user.id;
        // token.role = user.role;
      }
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
      }

      // 支持credentials登录验证strategy: 'database'
      if (account?.provider === 'credentials' && sessionOptions.strategy !== 'jwt') {
        const authSession = await adapter.createSession!({
          sessionToken: sessionOptions.generateSessionToken!() as any,
          userId: user.id,
          expires: new Date(Date.now() + sessionOptions.maxAge! * 1000),
        });
        token.sessionToken = authSession.sessionToken;
      }

      return token;
    },

    async session({
      session, token, user, trigger,
    }) {
      console.log('session-callback', token, user, trigger);
      if (token.accessToken) {
        session.accessToken = token.accessToken;
      }

      return {
        ...session,
        // user: {
        //   ...session.user,
        // },
      };
    },
  },
  pages: {
    signIn: '/signin',
    verifyRequest: '/signin/verify',
  },
};

export const handler = NextAuth(authOptions);

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export function getServerAuthSession(...args: [GetServerSidePropsContext['req'], GetServerSidePropsContext['res']] | [NextApiRequest, NextApiResponse] | []) {
  return getServerSession(...args, authOptions);
}

export async function getServerAuthToken() {
  return getToken({
    req: {
      cookies: await cookies(),
    } as any,
  });
}

export async function getCsrfAuthToken() {
  // https://github.com/nextauthjs/next-auth/discussions/7256
  return getCsrfToken({
    req: {
      headers: {
        cookie: (await cookies()).toString(),
      },
    },
  });
}

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    sessionToken?: string;
  }
}
