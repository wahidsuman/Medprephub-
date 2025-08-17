
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure for Replit deployment
  async rewrites() {
    return [];
  },
  // Ensure proper host binding for Replit
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

module.exports = nextConfig;
