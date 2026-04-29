import type { Metadata } from 'next';
import React from 'react';
import { DEFAULT_OG_IMAGE } from '@/lib/metadata';
import TransferFlowClient from './TransferFlowClient';

const BASE = 'https://www.profootballnetwork.com/cfb-hq';

export const metadata: Metadata = {
  title: 'Team Transfer Streams | CFB Portal Flow Visualization | CFB HQ',
  description:
    'Interactive visualization showing every FBS team\'s 2026 transfer portal activity. See which schools players came from and where outgoing transfers went — tap any school to explore their transfers.',
  keywords: [
    'CFB Team Transfer Streams',
    'College Football Transfer Visualization',
    'Transfer Portal Flow',
    'CFB Transfer Portal Map',
    'Where Transfers Come From',
    'College Football Transfer Tracker',
    'CFB Portal Activity',
    'Transfer Portal Streams',
    'College Football Transfer Data',
    'FBS Transfer Portal Tool',
    'Incoming Outgoing Transfers',
    'CFB Portal Visualization',
  ],
  openGraph: {
    title: 'Team Transfer Streams | CFB Portal Flow Visualization | CFB HQ',
    description:
      'Visualization of CFB transfer portal activity — see every team\'s 2026 incoming and outgoing transfers with school-to-school flow ribbons.',
    url: `${BASE}/transfer-flow`,
    type: 'website',
    siteName: 'CFB HQ - Pro Football Network',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Team Transfer Streams | CFB Portal Flow Visualization | CFB HQ',
    description:
      'Interactive visualization showing where 2026 CFB transfers came from and went to — select any FBS team to see their portal activity.',
    creator: '@PFSN365',
    site: '@PFSN365',
  },
  alternates: {
    canonical: `${BASE}/transfer-flow`,
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

export default function TransferFlowPage() {
  return (
    <React.Suspense>
      <TransferFlowClient />
    </React.Suspense>
  );
}
