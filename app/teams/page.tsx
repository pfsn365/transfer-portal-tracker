import { Metadata } from 'next';
import TeamsListClient from './TeamsListClient';

export const metadata: Metadata = {
  title: 'Browse All FBS Teams | CFB HQ',
  description: 'Browse all FBS college football teams. View team rosters, schedules, stats, transfer portal activity, and standings.',
  keywords: [
    'FBS Teams',
    'College Football Teams',
    'CFB Teams',
    'NCAA Football Teams',
    'FBS Rosters',
    'College Football Directory',
  ],
  openGraph: {
    title: 'Browse All FBS Teams | CFB HQ',
    description: 'Browse all FBS college football teams. View team rosters, schedules, stats, transfer portal activity, and standings.',
    url: 'https://www.profootballnetwork.com/cfb-hq/teams',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse All FBS Teams | CFB HQ',
    description: 'Browse all FBS college football teams. View rosters, schedules, stats, and transfer portal activity.',
  },
  alternates: {
    canonical: 'https://www.profootballnetwork.com/cfb-hq/teams',
  },
};

export default function TeamsPage() {
  return <TeamsListClient />;
}
