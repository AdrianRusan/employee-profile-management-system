import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack configuration (moved to top-level in Next.js 16)
  turbopack: {
    // Set workspace root to silence the multiple lockfiles warning
    root: process.cwd(),
  },
};

export default nextConfig;
