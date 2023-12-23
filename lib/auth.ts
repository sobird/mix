/**
 * auth.ts
 *
 * @see https://authjs.dev/getting-started/typescript#module-augmentation
 *
 * sobird<i@sobird.me> at 2023/11/28 21:14:31 created.
 */

/* eslint-disable no-param-reassign */
import { getServerSession, type AuthOptions, DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/email';
import { GetServerSidePropsContext } from 'next';
import { sendVerificationRequest } from './mailer';
import AuthAdapter from './authSequelizeAdapter';
import User from '@/models/user';

declare module '@auth/core' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's postal address. */
      address: string
      /**
       * By default, TypeScript merges new interface properties and overwrite existing ones.
       * In this case, the default session user properties will be overwritten, with the new one defined above.
       * To keep the default session user properties,
       * you need to add them back into the newly declared interface
       */
    } & DefaultSession['user'] // To keep the default types
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User {}

  /**
   * The shape of the account object returned in the OAuth providers' `account` callback,
   * Usually contains information about the provider being used, like OAuth tokens (`access_token`, etc).
   */
  interface Account {}
}

export const authOptions: AuthOptions = {
  secret: 'sobird@2023',
  session: {
    // strategy: 'jwt',
    // maxAge: 30 * 24 * 60 * 60, // 30 days
    // updateAge: 24 * 60 * 60, // 24 hours
  },
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
          placeholder: '请输入用户名',
        },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials, req) {
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
  callbacks: {
    async signIn({
      user, account, profile, email, credentials,
    }) {
      console.log('signIn', user);
      return false;
    },

    session: ({
      session, token, user, trigger,
    }) => {
      console.log('Session Callback', {
        session, token, user, trigger,
      });

      return {
        ...session,
        user: {
          ...session.user,
          // username: (user as any).username,
        },
      };
    },

    jwt: ({
      token, user, account, profile, trigger,
    }) => {
      const isNewUser = trigger === 'signUp';
      console.log('JWT Callback', {
        token, user, account, profile, isNewUser,
      });

      if (user) {
        token.id = user.id;
      }
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
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
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext['req'];
  res: GetServerSidePropsContext['res'];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
