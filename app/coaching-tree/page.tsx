import type { Metadata } from 'next';
import React from 'react';
import { DEFAULT_OG_IMAGE } from '@/lib/metadata';
import CoachingTreeLanding from './CoachingTreeLanding';

const BASE = 'https://www.profootballnetwork.com/cfb-hq';

export const metadata: Metadata = {
  title: 'CFB Coaching Tree | College Football Coaching Lineages | CFB HQ',
  description:
    'Explore college football coaching trees — see who mentored who, trace any coach\'s lineage, and discover the full network of CFB coaching relationships across generations.',
  keywords: [
    'CFB Coaching Tree',
    'College Football Coaching Lineage',
    'Nick Saban Coaching Tree',
    'Urban Meyer Coaching Tree',
    'College Football Coaches',
    'CFB Coach Mentor',
    'Coaching Staff History',
    'CFB Head Coach Tree',
  ],
  openGraph: {
    title: 'CFB Coaching Tree | College Football Coaching Lineages | CFB HQ',
    description:
      'Trace any coach\'s full lineage — who mentored them, who they developed, and how the biggest coaching trees in CFB are connected.',
    url: `${BASE}/coaching-tree`,
    type: 'website',
    siteName: 'CFB HQ - Pro Football Network',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CFB Coaching Tree | College Football Coaching Lineages | CFB HQ',
    description: 'Explore the coaching trees and lineages behind every major CFB program.',
    creator: '@PFSN365',
    site: '@PFSN365',
  },
  alternates: { canonical: `${BASE}/coaching-tree` },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
};

export default function CoachingTreePage() {
  return (
    <React.Suspense>
      <CoachingTreeLanding />
    </React.Suspense>
  );
}
