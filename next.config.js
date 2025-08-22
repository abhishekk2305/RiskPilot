/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable experimental features for better ESM compatibility
    esmExternals: true,
  },
  // Enable standalone output for better deployment compatibility
  output: 'standalone',
  // Disable static generation as we're using Express server
  trailingSlash: false,
  // Configure for custom server
  useFileSystemPublicRoutes: false,
}

module.exports = nextConfig;