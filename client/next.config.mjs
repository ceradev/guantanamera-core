import { withSentryConfig } from "@sentry/nextjs";
import withPWA from "next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

const pwaConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  // Don't cache API calls
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.barguantanamera\.com\/.*/i,
      handler: 'NetworkOnly',
    },
    {
      urlPattern: /^http:\/\/localhost:8000\/.*/i,
      handler: 'NetworkOnly',
    }
  ]
})(nextConfig);

export default withSentryConfig(
  pwaConfig,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses all logs
    silent: true,
    org: "guantanamera-core",
    project: "guantanamera-dashboard",
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: true,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers
    tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Disables automatic instrumentation of Vercel Cron Monitors.
    // (It's not mentioned, but good practice if not on Vercel or not using Crons)
    automaticVercelMonitors: false,
  }
);
