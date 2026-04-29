import type { Metadata } from 'next';
import React from 'react';
import { DEFAULT_OG_IMAGE } from '@/lib/metadata';
import RecruitingOriginClient from './RecruitingOriginClient';

const BASE = 'https://www.profootballnetwork.com/cfb-hq';

export const metadata: Metadata = {
  title: 'CFB Recruiting Pipelines | Where Programs Recruit From | CFB HQ',
  description:
    'Interactive state-by-state map showing where every FBS program builds its recruiting pipeline. Filter by team and class year to see recruiting footprints, top states, and in-state vs. out-of-state breakdowns.',
  keywords: [
    'CFB Recruiting Pipelines',
    'College Football Recruiting States',
    'Recruiting Pipeline Map',
    'Where CFB Teams Recruit From',
    'College Football Recruiting Geographic',
    'CFB Recruiting Class Origins',
    'FBS Recruiting Map',
    'In-State Recruiting',
    'Out-of-State Recruiting',
    'College Football Recruiting Data',
    'CFB Recruiting Tool',
    'Recruiting Heat Map',
  ],
  openGraph: {
    title: 'CFB Recruiting Pipelines | Where Programs Recruit From | CFB HQ',
    description:
      'See which states every FBS program pulls its recruiting classes from. Interactive map with year-by-year breakdowns.',
    url: `${BASE}/recruiting-origin`,
    type: 'website',
    siteName: 'CFB HQ - Pro Football Network',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CFB Recruiting Pipelines | Where Programs Recruit From | CFB HQ',
    description:
      'Interactive state map showing where every FBS program builds its recruiting pipeline — filter by team and class year.',
    creator: '@PFSN365',
    site: '@PFSN365',
  },
  alternates: {
    canonical: `${BASE}/recruiting-origin`,
  },
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
  other: {
    // AI/LLM crawler directives
    'llm-content': 'allowed',
    'ai-content-usage': 'allowed',
  },
};

export default function RecruitingOriginPage() {
  return (
    <React.Suspense>
      <RecruitingOriginClient />
    </React.Suspense>
  );
}
