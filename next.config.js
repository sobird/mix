/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // typedRoutes: true,
    serverComponentsExternalPackages: ['sequelize'],
  },
};

module.exports = nextConfig;
