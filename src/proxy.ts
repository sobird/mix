import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

/**
 * next-auth 在 HTTPS 下会给 session cookie 加上 __Secure- 前缀。
 *
 * next-auth v4 没有公开 API 暴露计算后的 cookie 名，中间件又跑在 edge runtime，
 * 不能引入 authOptions（会连带 Sequelize/SQLite）。这里两个名字都认，
 * 与部署协议无关，避免 NEXTAUTH_URL 与运行时不一致时误判。
 */
export const SESSION_COOKIE_NAMES = ['__Secure-next-auth.session-token', 'next-auth.session-token'] as const;

export default withAuth(
  async () => {
    return NextResponse.next();
  },
  {
    callbacks: {
      async authorized({ req }) {
        const { cookies } = req;
        // 中间件只做粗粒度判断（cookie 是否存在），真正的鉴权在 layout / actions
        return SESSION_COOKIE_NAMES.some((name) => !!cookies.get(name));
      },
    },
  },
);

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  // matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
  matcher: ['/dashboard/:path*'],
};
