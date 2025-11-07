import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Turbopack configuration (moved to top-level in Next.js 16)
  turbopack: {
    // Set workspace root to silence the multiple lockfiles warning
    root: process.cwd(),
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
