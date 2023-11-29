import type { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/email';
import SequelizeAdapter, { models } from '@auth/sequelize-adapter';
import { sendVerificationRequest } from './mailer';
import sequelize from './sequelize';

console.log('models', sequelize.models, models);

export const authOptions: AuthOptions = {
  secret: 'sobird',
  session: {
    strategy: 'jwt',
  },
  adapter: SequelizeAdapter(sequelize, {
    synchronize: true,
  }),
  providers: [
    CredentialsProvider({
      name: 'Sign in',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'example@example.com',
        },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        // const authResponse = await fetch('/users/login', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify(credentials),
        // });

        // if (!authResponse.ok) {
        //   return null;
        // }

        // const user = await authResponse.json();
        const user = { id: '1', name: 'Admin', email: 'admin@admin.com' };

        return user as any;
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
      async sendVerificationRequest(params) {
        sendVerificationRequest(params);
      },
      async generateVerificationToken() {
        return 'ABC123';
      },
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
    // signIn: '/signin',
  },
};
