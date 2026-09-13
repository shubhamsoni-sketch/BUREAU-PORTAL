import { imageHosts } from './image-hosts.config.mjs';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: projectRoot,
  productionBrowserSourceMaps: false,
  distDir: process.env.DIST_DIR || '.next',
  serverExternalPackages: ['@sparticuz/chromium'],
  outputFileTracingIncludes: {
    '/api/bureau-report-pdf': ['./node_modules/@sparticuz/chromium/bin/**/*'],
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: imageHosts,
    minimumCacheTTL: 60,
  },

  async redirects() {
    return [
      // Removed: redirect from / to /partner-dashboard — / is now the login page
    ];
  },
};
export default nextConfig;
