import { Metadata } from 'next';
import StandingsClient from './StandingsClient';

export const metadata: Metadata = {
  title: 'CFB Standings 2025 | College Football Conference Standings',
  description: 'View current college football standings for all FBS and FCS conferences. Track conference records, overall records, and winning streaks for every team.',
  keywords: [
    'CFB Standings',
    'College Football Standings',
    'FBS Standings',
    'FCS Standings',
    'Conference Standings',
    'SEC Standings',
    'Big Ten Standings',
    'NCAA Football Standings',
  ],
  openGraph: {
    title: 'CFB Standings 2025 | College Football Conference Standings',
    description: 'View current college football standings for all FBS and FCS conferences. Track conference records, overall records, and winning streaks.',
    url: 'https://profootballnetwork.com/cfb-hq/standings',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CFB Standings 2025 | College Football Conference Standings',
    description: 'View current college football standings for all FBS and FCS conferences.',
  },
  alternates: {
    canonical: 'https://profootballnetwork.com/cfb-hq/standings',
  },
};

export default function StandingsPage() {
  return <StandingsClient />;
}
