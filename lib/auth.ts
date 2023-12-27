/**
 * auth.ts
 *
 *
 * @see https://authjs.dev/getting-started/typescript#module-augmentation
 * @see https://github.com/nextauthjs/next-auth/blob/main/packages/core/src/lib/init.ts
 * @see https://github.com/nextauthjs/next-auth/discussions/4394
 * @see https://remaster.com/blog/next-auth-jwt-session
 *
 * sobird<i@sobird.me> at 2023/11/28 21:14:31 created.
 */

/* eslint-disable no-param-reassign */
import {
  getServerSession, type AuthOptions,
} from 'next-auth';
import { encode, getToken } from 'next-auth/jwt';
import { v4 as uuidv4 } from 'uuid';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/email';
import { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next';
import { cookies } from 'next/headers';
import { sendVerificationRequest } from './mailer';
import AuthAdapter from './authSequelizeAdapter';
import User from '@/models/user';

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

const sessionOptions:AuthOptions['session'] = {
  strategy: 'jwt', // default: database
  maxAge: 30 * 24 * 60 * 60, // 30 days
  updateAge: 24 * 60 * 60, // 24 hours
  generateSessionToken: uuidv4,
};

const jwt = {
  async encode(params: any) {
    return params.token?.sessionToken ?? encode(params);
  },
};

export const authOptions: AuthOptions = {
  session: sessionOptions,
  jwt,
  adapter: AuthAdapter,
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
        password: { label: '密码', type: 'password', value: 'sobird' },
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
            image: 'image',
            role: 'admin',
          };
        } catch (e) {
          throw Error(e);
        }
      },
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

    async session({
      session, token, user, trigger,
    }) {
      console.log('session-callback', token, user, trigger);

      return {
        ...session,
        // user: {
        //   ...session.user,
        // },
      };
    },

    async jwt({
      token, user, account,
    }) {
      console.log('jwt-callback', token, user, account);
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
      }
      // 支持credentials登录验证strategy: 'database'
      if (account?.provider === 'credentials' && sessionOptions.strategy !== 'jwt') {
        const session = await AuthAdapter.createSession!({
          sessionToken: sessionOptions.generateSessionToken!() as any,
          userId: user.id,
          expires: new Date(Date.now() + sessionOptions.maxAge! * 1000),
        });
        token.sessionToken = session.sessionToken;
      }
      return token;
    },
  },
  pages: {
    // signIn: '/signin',
    verifyRequest: '/signin/verify',
  },
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export function getServerAuthSession(...args: [GetServerSidePropsContext['req'], GetServerSidePropsContext['res']] | [NextApiRequest, NextApiResponse] | []) {
  return getServerSession(...args, authOptions);
}

export function getServerAuthToken() {
  return getToken({
    req: {
      cookies: cookies(),
    } as any,
  });
}
