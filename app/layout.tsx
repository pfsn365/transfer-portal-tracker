import type { Metadata } from "next";
import "./globals.css";
import GoogleAnalytics from '@/components/GoogleAnalytics';
import RaptiveScript from '@/components/RaptiveScript';
import VideoPlayerScript from '@/components/VideoPlayerScript';
import CanonicalURL from '@/components/CanonicalURL';
import StructuredData from '@/components/StructuredData';

export const metadata: Metadata = {
  metadataBase: new URL('https://profootballnetwork.com/cfb-hq/transfer-portal-tracker'),
  title: {
    default: "CFB Transfer Portal Tracker - College Football Portal News",
    template: "%s | CFB Transfer Portal Tracker"
  },
  description: "Track all college football transfer portal activity in real-time. Filter by status, school, position, class, and conference. The most comprehensive CFB transfer portal tracker.",
  keywords: [
    "CFB Transfer Portal",
    "College Football Transfer Portal",
    "Transfer Portal Tracker",
    "NCAA Transfer Portal",
    "College Football Transfers",
    "Portal News",
    "CFB Recruiting",
    "Transfer Portal Database",
    "Pro Football Network"
  ],
  authors: [{ name: "Pro Football Network" }],
  creator: "Pro Football Network",
  publisher: "Pro Football Network",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://profootballnetwork.com/cfb-hq/transfer-portal-tracker',
    title: 'CFB Transfer Portal Tracker - College Football Portal News',
    description: 'Track all college football transfer portal activity in real-time. Filter by status, school, position, class, and conference.',
    siteName: 'CFB Transfer Portal Tracker',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CFB Transfer Portal Tracker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CFB Transfer Portal Tracker - College Football Portal News',
    description: 'Track all college football transfer portal activity in real-time. The most comprehensive CFB transfer portal tracker.',
    creator: '@PFN365',
    site: '@PFN365',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://profootballnetwork.com/cfb-hq/transfer-portal-tracker',
  },
  verification: {
    google: 'verification-code-here', // Add your Google Search Console verification code
  },
  category: 'sports',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-us">
      <head>
        {/* Analytics and Ad Scripts */}
        <GoogleAnalytics />
        <RaptiveScript />

        {/* Resource hints for performance */}
        <link rel="dns-prefetch" href="//www.profootballnetwork.com" />
        <link rel="dns-prefetch" href="//ads.adthrive.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.profootballnetwork.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Preload critical assets */}
        <link rel="preload" as="image" href="https://a.espncdn.com/i/teamlogos/ncaa/500/default-team-logo-500.png" />

        {/* Font display optimization */}
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;600;700&display=swap" as="style" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Roboto:wght@400;500;700&family=Open+Sans:wght@400;600;700&display=swap" />

        {/* Theme colors */}
        <meta name="theme-color" content="#0050A0" />
        <meta name="msapplication-TileColor" content="#0050A0" />

        {/* Mobile Optimization */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="application-name" content="CFB Transfer Portal Tracker" />
        <meta name="apple-mobile-web-app-title" content="CFB Portal Tracker" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="HandheldFriendly" content="true" />
        <meta name="MobileOptimized" content="width" />

        {/* Performance and security */}
        <meta httpEquiv="X-DNS-Prefetch-Control" content="on" />
      </head>
      <body className="antialiased raptive-pfn-disable-footer-close pb-24">
        <CanonicalURL />
        <VideoPlayerScript />
        <StructuredData />
        {children}
      </body>
    </html>
  );
}
