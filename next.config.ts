import type { NextConfig } from "next";

const basePath = '/cfb-hq';

const nextConfig: NextConfig = {
  basePath: basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
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
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
