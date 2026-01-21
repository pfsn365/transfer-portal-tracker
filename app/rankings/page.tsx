import { Metadata } from 'next';
import RankingsClient from './RankingsClient';

export const metadata: Metadata = {
  title: 'CFB Rankings 2025 | AP Top 25, Coaches Poll & CFP Rankings',
  description: 'View the latest college football rankings including AP Top 25, Coaches Poll, and College Football Playoff rankings with week-over-week movement.',
  keywords: [
    'CFB Rankings',
    'College Football Rankings',
    'AP Top 25',
    'Coaches Poll',
    'CFP Rankings',
    'College Football Playoff Rankings',
    'NCAA Football Rankings',
  ],
  openGraph: {
    title: 'CFB Rankings 2025 | AP Top 25, Coaches Poll & CFP Rankings',
    description: 'View the latest college football rankings including AP Top 25, Coaches Poll, and College Football Playoff rankings.',
    url: 'https://www.profootballnetwork.com/cfb-hq/rankings',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CFB Rankings 2025 | AP Top 25, Coaches Poll & CFP Rankings',
    description: 'View the latest college football rankings including AP Top 25, Coaches Poll, and CFP rankings.',
  },
  alternates: {
    canonical: 'https://www.profootballnetwork.com/cfb-hq/rankings',
  },
};

export default function RankingsPage() {
  return <RankingsClient />;
}
