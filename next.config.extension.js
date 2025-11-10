/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Ignore API routes during export
  experimental: {
    typedRoutes: false,
  },
  // Optional: ignore certain folders (like /api)
  webpack(config) {
    config.externals.push({
      './app/api/*': '{}',
    });
    return config;
  },
};

export default nextConfig;
