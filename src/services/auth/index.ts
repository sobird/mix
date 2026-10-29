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
import NextAuth, { getServerSession, type AuthOptions, type DefaultSession } from 'next-auth';
import { encode, getToken, type JWTEncodeParams } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import EmailProvider from 'next-auth/providers/email';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { getCsrfToken } from 'next-auth/react';
import { cookies } from 'next/headers';
import { cache } from 'react';

import { Session } from '@/models/Session';
import { User } from '@/models/User';

import { sendVerificationRequest } from '../mailer';
import adapter from './adapter-sequelize';

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

/** 凭证登录失败时对客户端统一的提示 */
const INVALID_CREDENTIALS_MESSAGE = '用户名或密码错误';
/** 封禁账号的专用提示；是否区分由产品决定，但不能泄露其他细节 */
const ACCOUNT_DISABLED_MESSAGE = '账号已被禁用';

const sessionOptions: AuthOptions['session'] = {
  strategy: 'database', // default: database
  maxAge: 30 * 24 * 60 * 60, // 30 days
  updateAge: 24 * 60 * 60, // 24 hours
  generateSessionToken: randomUUID,
};

/**
 * credentials + database 属于 next-auth 官方不支持的组合。
 *
 * 上面 sessionOptions.strategy 为 'database' 时，next-auth 仍会为 credentials
 * 登录签发 JWT cookie，因此这里覆写 encode：回调已手工写入 sessions 表，
 * token 里带 sessionToken，就直接把裸 sessionToken 当作 cookie 值返回，
 * 让后续请求走 database session 查询。升级 next-auth 时必须回归此逻辑。
 */
const jwtOptions = {
  async encode(params: JWTEncodeParams) {
    return params.token?.sessionToken ?? encode(params);
  },
};

export const authOptions: AuthOptions = {
  session: sessionOptions,
  jwt: jwtOptions,
  adapter,
  // next-auth 默认读 NEXTAUTH_SECRET ?? AUTH_SECRET；这里显式传入，避免依赖隐式行为
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
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
            id: String(user.id),
            image: user.image,
            // role: 'manage',
          };
        } catch (e) {
          const reason = e instanceof Error ? e.message : String(e);
          // 真实原因只写服务端日志，避免向客户端泄露用户是否存在
          console.warn(`[auth] credentials 登录失败: ${reason}`);

          if (reason === '用户已被禁用') {
            throw new Error(ACCOUNT_DISABLED_MESSAGE, { cause: e });
          }
          throw new Error(INVALID_CREDENTIALS_MESSAGE, { cause: e });
        }
      },
    }),
    GithubProvider({
      clientId: process.env.AUTH_GITHUB_ID || '',
      clientSecret: process.env.AUTH_GITHUB_SECRET || '',
      httpOptions: {
        timeout: 30000,
      },
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
    async signIn({ user }) {
      // 已存在用户（OAuth 再次登录 / Email 登录）由 adapter 提供 status；
      // 首次 OAuth 登录时 user 是第三方 profile，没有 status，放行。
      const status = (user as { status?: boolean | number } | undefined)?.status;
      return status === undefined || Number(status) !== 0;
    },

    async jwt({ token, trigger, session, user, account }) {
      // database 策略下 updateSession 直接写库，下面 update 分支不会触发；
      // 保留仅为将来切换 jwt 策略时可用。
      if (trigger === 'update' && session?.user) {
        token.name = session.user.name;
      }
      if (user) {
        token.id = user.id;
        // token.role = user.role;
      }
      // database 策略下 session 回调拿不到 token，写在这里的 accessToken 不会被读取；
      // 且 credentials 路径没有 access_token。保留仅为将来切换 jwt 策略时可用。
      if (account) {
        token.accessToken = account.access_token;
      }

      // 支持 credentials 登录配合 strategy: 'database'（非官方组合，见 jwtOptions 注释）
      if (account?.type === 'credentials' && sessionOptions.strategy !== 'jwt' && user) {
        // 登录即踢掉该用户在其他设备上的旧会话
        await Session.destroy({ where: { userId: Number(user.id) } });

        const authSession = await adapter.createSession!({
          sessionToken: await sessionOptions.generateSessionToken!(),
          userId: user.id,
          expires: new Date(Date.now() + sessionOptions.maxAge! * 1000),
        });
        token.sessionToken = authSession.sessionToken;
      }

      return token;
    },

    async session({ session, token, user, trigger: _trigger }) {
      // database 策略下 next-auth 不传 token，此分支永不生效；
      // 保留仅为将来切换 jwt 策略时可用。
      if (token?.accessToken) {
        session.accessToken = token.accessToken;
      }

      if (user?.id) session.user.id = String(user.id);

      return session;
    },
  },
  pages: {
    signIn: '/signin',
    verifyRequest: '/signin/verify',
  },
};

export const handler = NextAuth(authOptions);

/**
 * 无参读取的请求级缓存：同一请求内 layout / ability / menu / actions 只查询一次 session。
 *
 * React `cache()` 的作用域是单次请求，跨请求不会串用；带 req/res 的 pages/API 场景不走缓存。
 */
const getServerSessionCached = cache(async () => getServerSession(authOptions));

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export function getServerAuthSession(
  ...args: [GetServerSidePropsContext['req'], GetServerSidePropsContext['res']] | [NextApiRequest, NextApiResponse] | []
) {
  if (args.length === 0) {
    return getServerSessionCached();
  }

  return getServerSession(args[0], args[1], authOptions);
}

export function parseSessionUserId(userId: unknown): number | null {
  const id = Number(userId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function getSessionUserId(): Promise<number | null> {
  const session = await getServerAuthSession();
  return parseSessionUserId(session?.user?.id);
}

/**
 * @deprecated database 策略下 cookie 是裸 UUID，`getToken` 必然解出 null；且当前无调用方。
 */
export async function getServerAuthToken() {
  return getToken({
    req: {
      cookies: await cookies(),
    } as any,
  });
}

/**
 * @deprecated 当前无调用方。
 *
 * @see https://github.com/nextauthjs/next-auth/discussions/7256
 */
export async function getCsrfAuthToken() {
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
    user: { id: string } & DefaultSession['user'];
    // database 策略下永不写入；保留仅为兼容 jwt 策略
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    // database 策略下 session 回调读不到；保留仅为兼容 jwt 策略
    accessToken?: string;
    sessionToken?: string;
  }
}
