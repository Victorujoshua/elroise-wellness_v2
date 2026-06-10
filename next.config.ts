import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}

export default withSentryConfig(nextConfig, {
  // Sentry org + project — set SENTRY_ORG and SENTRY_PROJECT in CI / Vercel env
  org:     process.env.SENTRY_ORG     ?? 'elroise-wellness',
  project: process.env.SENTRY_PROJECT ?? 'elroise-wellness-web',

  // Only print Sentry build output in CI
  silent: !process.env.CI,

  // Upload a larger set of source maps so stack traces are more accurate
  widenClientFileUpload: true,

  // Hide source maps from the public bundle
  sourcemaps: { deleteSourcemapsAfterUpload: true },

  // Suppresses source map upload logs during build
  disableLogger: true,

  // Automatically instrument Vercel Cron Monitors
  automaticVercelMonitors: true,
})
