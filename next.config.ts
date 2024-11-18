/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // experimental: {
  //   // typedRoutes: true,
  //   esmExternals: false,
  // },
  serverExternalPackages: ['sequelize'],
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
};

export default nextConfig;
