import { Metadata } from 'next';
import PowerRankingsClient from './PowerRankingsClient';

export const metadata: Metadata = {
  title: 'CFB Power Rankings Builder 2025 | Create Your Own Rankings',
  description: 'Create and customize your own college football power rankings. Drag and drop teams, save multiple rankings, and download shareable images.',
  keywords: [
    'CFB Power Rankings',
    'College Football Power Rankings',
    'Power Rankings Builder',
    'CFB Rankings',
    'Create Power Rankings',
    'College Football Rankings',
    'FBS Power Rankings',
    'FCS Power Rankings',
  ],
  openGraph: {
    title: 'CFB Power Rankings Builder 2025 | Create Your Own Rankings',
    description: 'Create and customize your own college football power rankings. Drag and drop teams, save multiple rankings, and download shareable images.',
    url: 'https://profootballnetwork.com/cfb-hq/power-rankings-builder',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CFB Power Rankings Builder 2025 | Create Your Own Rankings',
    description: 'Create and customize your own college football power rankings. Drag, drop, save, and share.',
  },
  alternates: {
    canonical: 'https://profootballnetwork.com/cfb-hq/power-rankings-builder',
  },
};

export default function PowerRankingsPage() {
  return <PowerRankingsClient />;
}
