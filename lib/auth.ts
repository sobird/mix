/* eslint-disable no-param-reassign */
import type { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/email';
import { sendVerificationRequest } from './mailer';
import AuthAdapter from './authAdapter';
import User from '@/models/user';

export const authOptions: AuthOptions = {
  secret: 'sobird@2023',
  session: {
    // strategy: 'jwt',
  },
  adapter: AuthAdapter,
  // cookies: {},
  providers: [
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

        try {
          const user = await User.signin({ username, password });
          return user.get({ plain: true }) ?? null;
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
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      // maxAge: process.env.EMAIL_MAX_AGE,
      sendVerificationRequest,
      // async generateVerificationToken() {
      //   return 'ABC123';
      // },
    }),
  ],
  callbacks: {
    session: ({ session, token, user }) => {
      console.log('Session Callback', { session, token, user });

      return {
        ...session,
        user: {
          ...session.user,
          username: (user as any).username,
        },
      };
    },
    jwt: ({
      token, user, account, profile, isNewUser,
    }) => {
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
    signIn: '/signin',
    verifyRequest: '/signin/verify',
  },
};
