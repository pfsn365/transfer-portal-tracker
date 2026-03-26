import type { Metadata } from 'next';
import DraftHistoryClient from './DraftHistoryClient';

export const metadata: Metadata = {
  title: 'NFL Draft History & School Pipeline',
  description:
    'Explore which college football programs produce the most NFL draft picks. Search draft history by school, year, round, and position.',
  openGraph: {
    title: 'NFL Draft History & School Pipeline',
    description:
      'Explore which college football programs produce the most NFL draft picks. Search draft history by school, year, round, and position.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NFL Draft History & School Pipeline',
    description:
      'Explore which college football programs produce the most NFL draft picks. Search draft history by school, year, round, and position.',
  },
};

export default function DraftHistoryPage() {
  return <DraftHistoryClient />;
}
