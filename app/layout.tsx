import type { Metadata } from "next";
import "./globals.css";
import GoogleAnalytics from '@/components/GoogleAnalytics';

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-us">
      <head>
        <GoogleAnalytics />

        {/* Resource hints for performance */}
        <link rel="dns-prefetch" href="//www.profootballnetwork.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.profootballnetwork.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Theme colors */}
        <meta name="theme-color" content="#FF6B35" />
        <meta name="msapplication-TileColor" content="#FF6B35" />

        {/* Performance and security */}
        <meta httpEquiv="X-DNS-Prefetch-Control" content="on" />
      </head>
      <body className="antialiased pb-24">
        {children}
      </body>
    </html>
  );
}
