import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Turbopack configuration (moved to top-level in Next.js 16)
  turbopack: {
    // Set workspace root to silence the multiple lockfiles warning
    root: process.cwd(),
  },

  // Security headers for production
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during build
  silent: true,

  // Upload source maps to Sentry for better error stack traces
  // This requires SENTRY_AUTH_TOKEN environment variable
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // For development, you can disable source map upload
  // dryRun: process.env.NODE_ENV === 'development',
};

// Export configuration with Sentry integration
export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
