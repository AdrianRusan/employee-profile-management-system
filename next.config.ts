import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Standalone output is needed for Docker but causes issues on Windows
// due to Turbopack generating files with colons in names (e.g., node:inspector)
// Windows doesn't allow colons in filenames
const isWindows = process.platform === 'win32';
const isDocker = process.env.DOCKER_BUILD === 'true';

const nextConfig: NextConfig = {
  // Enable standalone output for Docker deployment only
  // Skip on Windows to avoid EINVAL errors with colon-containing filenames
  ...((!isWindows || isDocker) && { output: 'standalone' as const }),

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
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://*.vercel.live", // unsafe-eval needed for Next.js dev, unsafe-inline for inline scripts, vercel.live for Vercel toolbar
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // unsafe-inline needed for Tailwind/styled-components
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com https://*.perplexity.ai",
              "connect-src 'self' https://api.resend.com https://*.sentry.io https://*.upstash.io https://*.vercel.app https://vercel.live https://*.vercel.live",
              "frame-src https://vercel.live https://*.vercel.live", // Allow Vercel Live toolbar iframe
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
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
