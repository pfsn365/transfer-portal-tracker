import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGE } from '@/lib/metadata';
import HeismanClient from './HeismanClient';

export const metadata: Metadata = {
  title: 'Heisman Trophy History | All Winners, Stats & Records | CFB HQ',
  description:
    'Complete Heisman Trophy history from 1935 to 2025. Browse every winner with their Heisman-season stats, school, conference, and team record. Filter by school, conference, and position.',
  keywords: [
    'Heisman Trophy History',
    'Heisman Trophy Winners',
    'Heisman Stats',
    'College Football Awards',
    'CFB Heisman',
    'Heisman by School',
    'Heisman Trophy List',
    'College Football History',
  ],
  openGraph: {
    title: 'Heisman Trophy History | All Winners, Stats & Records | CFB HQ',
    description:
      'Complete Heisman Trophy history from 1935 to present. Browse every winner with their Heisman-season stats, school, and team record.',
    url: 'https://www.profootballnetwork.com/cfb-hq/heisman',
    type: 'website',
    siteName: 'CFB HQ - Pro Football Network',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Heisman Trophy History | All Winners, Stats & Records | CFB HQ',
    description:
      'Complete Heisman Trophy history from 1935 to present. Browse every winner with their Heisman-season stats, school, and team record.',
  },
  alternates: {
    canonical: 'https://www.profootballnetwork.com/cfb-hq/heisman',
  },
};

export default function HeismanPage() {
  return <HeismanClient />;
}
