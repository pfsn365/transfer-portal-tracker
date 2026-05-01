import type { Metadata } from 'next';
import React from 'react';
import { DEFAULT_OG_IMAGE } from '@/lib/metadata';
import HeadToHeadClient from './HeadToHeadClient';

const BASE = 'https://www.profootballnetwork.com/cfb-hq';

export const metadata: Metadata = {
  title: 'CFB Head-to-Head | All-Time Series Records | CFB HQ',
  description:
    'Look up the all-time head-to-head record between any two FBS programs. Score margins, decade breakdowns, home/away/neutral splits, and the full game log for every CFB rivalry.',
  keywords: [
    'CFB Head to Head',
    'College Football Series Records',
    'All-Time CFB Records',
    'CFB Rivalry History',
    'College Football Matchup History',
    'Head to Head College Football',
    'CFB Series Record',
    'College Football Historical Records',
    'FBS Head to Head',
    'CFB Score History',
    'College Football All-Time Series',
    'CFB Rivalry Tracker',
  ],
  openGraph: {
    title: 'CFB Head-to-Head | All-Time Series Records | CFB HQ',
    description:
      'All-time head-to-head records between any two FBS programs — score margins, decade breakdowns, home/away splits, and the complete game log.',
    url: `${BASE}/head-to-head`,
    type: 'website',
    siteName: 'CFB HQ - Pro Football Network',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CFB Head-to-Head | All-Time Series Records | CFB HQ',
    description: 'Look up the all-time series record between any two college football programs.',
    creator: '@PFSN365',
    site: '@PFSN365',
  },
  alternates: { canonical: `${BASE}/head-to-head` },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  other: { 'llm-content': 'allowed', 'ai-content-usage': 'allowed' },
};

export default function HeadToHeadPage() {
  return (
    <React.Suspense>
      <HeadToHeadClient />
    </React.Suspense>
  );
}
