/** @type {import('next').NextConfig} */
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // experimental: {
  //   // typedRoutes: true,
  //   esmExternals: false,
  // },
  serverExternalPackages: ['sequelize', 'log4js'],
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },

  compiler: {
    styledComponents: true,
  },

  sassOptions: {
    silenceDeprecations: ['legacy-js-api'],
  },

  webpack(config) {
    // 处理 SVG 文件，使用 url-loader 转换为 Base64
    config.module.rules.push({
      test: /\.svg$/,
      use: [{
        loader: 'url-loader',
        options: {
          encoding: 'base64',
        },
      }],
    });

    return config;
  },
};

export default nextConfig;
