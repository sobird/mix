/** @type {import('next').NextConfig} */
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // E2E 使用独立的构建目录，避免与本地 `next dev` 争用 .next/dev 锁
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  // E2E 通过 127.0.0.1 访问开发服务器，放行该来源的开发资源与 HMR
  allowedDevOrigins: ['127.0.0.1'],
  output: 'standalone',
  // experimental: {
  //   // typedRoutes: true,
  //   esmExternals: false,
  // },
  serverExternalPackages: ['sequelize', 'log4js'],
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },

  sassOptions: {
    silenceDeprecations: ['legacy-js-api'],
  },
};

export default nextConfig;
