import type { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/email';
import { sendVerificationRequest } from './mailer';
import AuthAdapter from './authAdapter';
import User from '@/models/user';

export const authOptions: AuthOptions = {
  secret: 'sobird@2023',
  session: {
    strategy: 'jwt',
  },
  adapter: AuthAdapter,
  providers: [
    CredentialsProvider({
      name: 'Sign in',
      credentials: {
        username: {
          label: 'Username',
          type: 'text',
          placeholder: 'sobird',
        },
        password: { label: 'Password', type: 'password' },
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
    session: ({ session, token }) => {
      console.log('Session Callback', { session, token });
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          randomKey: token.randomKey,
        },
      };
    },
    jwt: ({ token, user }) => {
      console.log('JWT Callback', { token, user });
      if (user) {
        const u = user as unknown as any;
        return {
          ...token,
          id: u.id,
          randomKey: u.randomKey,
        };
      }
      return token;
    },
  },
  pages: {
    signIn: '/signin',
    verifyRequest: '/signin/verify',
  },
};
