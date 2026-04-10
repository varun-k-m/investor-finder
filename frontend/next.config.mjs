import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/v1/:path*`,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  // Source map uploads are skipped unless SENTRY_AUTH_TOKEN is provided
  disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
});
