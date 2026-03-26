import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGE } from '@/lib/metadata';
import DraftHistoryClient from './DraftHistoryClient';

export const metadata: Metadata = {
  title: 'NFL Draft History & School Pipeline | CFB HQ',
  description:
    'Explore which college football programs produce the most NFL draft picks. Search draft history by school, year, round, and position from 1967 to 2025.',
  keywords: [
    'NFL Draft History',
    'College Football Draft Picks',
    'CFB Draft Pipeline',
    'NFL Draft by School',
    'College Football to NFL',
    'Draft Picks by College',
    'NFL Draft Database',
    'CFB Draft Stats',
  ],
  openGraph: {
    title: 'NFL Draft History & School Pipeline | CFB HQ',
    description:
      'Explore which college football programs produce the most NFL draft picks. Search draft history by school, year, round, and position.',
    url: 'https://www.profootballnetwork.com/cfb-hq/draft-history',
    type: 'website',
    siteName: 'CFB HQ - Pro Football Network',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NFL Draft History & School Pipeline | CFB HQ',
    description:
      'Explore which college football programs produce the most NFL draft picks. Search by school, year, round, and position.',
  },
  alternates: {
    canonical: 'https://www.profootballnetwork.com/cfb-hq/draft-history',
  },
};

export default function DraftHistoryPage() {
  return <DraftHistoryClient />;
}
