import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGE } from '@/lib/metadata';
import ArticlesClient from './ArticlesClient';

export const metadata: Metadata = {
  title: 'CFB Articles & News - College Football Analysis',
  description:
    'Latest college football articles, analysis, and news. Stay up to date with expert CFB coverage, transfer portal updates, and in-depth breakdowns.',
  keywords: [
    'CFB Articles',
    'College Football News',
    'College Football Analysis',
    'CFB News',
    'Transfer Portal News',
    'College Football Updates',
    'CFB Coverage',
  ],
  openGraph: {
    title: 'CFB Articles & News - College Football Analysis',
    description:
      'Latest college football articles, analysis, and news. Stay up to date with expert CFB coverage and in-depth breakdowns.',
    url: 'https://www.profootballnetwork.com/cfb-hq/articles',
    type: 'website',
    siteName: 'CFB HQ - Pro Football Network',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CFB Articles & News - College Football Analysis',
    description:
      'Latest college football articles, analysis, and news from CFB HQ.',
  },
  alternates: {
    canonical: 'https://www.profootballnetwork.com/cfb-hq/articles',
  },
};

export default function ArticlesPage() {
  return <ArticlesClient />;
}
