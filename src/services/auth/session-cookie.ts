/** next-auth 在 HTTPS 下会给 session cookie 加上 __Secure- 前缀 */
const SECURE_SESSION_COOKIE_NAME = '__Secure-next-auth.session-token';
const SESSION_COOKIE_NAME = 'next-auth.session-token';

/**
 * 中间件按部署地址选择 session cookie 名，避免生产 HTTPS 下读错 cookie。
 *
 * @param authUrl 默认取 `NEXTAUTH_URL`；显式传入便于测试
 */
export function getSessionCookieName(authUrl: string | undefined = process.env.NEXTAUTH_URL): string {
  return authUrl?.startsWith('https://') ? SECURE_SESSION_COOKIE_NAME : SESSION_COOKIE_NAME;
}
