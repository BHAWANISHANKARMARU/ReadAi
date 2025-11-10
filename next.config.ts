import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    turbopack: {
      // Set root to the current project to silence lockfile root warning
      root: __dirname,
    },
  },
};

export default nextConfig;
