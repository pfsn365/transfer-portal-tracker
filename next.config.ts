import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/cfb-hq/transfer-portal-tracker',
  assetPrefix: '/cfb-hq/transfer-portal-tracker/',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.profootballnetwork.com',
      },
      {
        protocol: 'https',
        hostname: 'staticd.profootballnetwork.com',
      },
      {
        protocol: 'https',
        hostname: '**.espncdn.com',
      },
      {
        protocol: 'https',
        hostname: '**.on3.com',
      },
      {
        protocol: 'https',
        hostname: '247sports.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
