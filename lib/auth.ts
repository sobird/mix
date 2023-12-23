/**
 * auth.ts
 *
 *
 * @see https://authjs.dev/getting-started/typescript#module-augmentation
 * @see https://github.com/nextauthjs/next-auth/blob/main/packages/core/src/lib/init.ts
 *
 * sobird<i@sobird.me> at 2023/11/28 21:14:31 created.
 */

/* eslint-disable no-param-reassign */
import { getServerSession, type AuthOptions, DefaultSession } from 'next-auth';
import { encode } from 'next-auth/jwt';
import { v4 as uuidv4 } from 'uuid';
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

const sessionOptions:AuthOptions['session'] = {
  // strategy: 'jwt',
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
  secret: 'sobird@2023',
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
            image: 'image',
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
      if (user) {
        token.id = user.id;
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
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext['req'];
  res: GetServerSidePropsContext['res'];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
