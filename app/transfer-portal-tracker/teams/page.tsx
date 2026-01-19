import { Metadata } from 'next';
import TeamsClient from './TeamsClient';

export const metadata: Metadata = {
  title: 'Browse All Teams | CFB Transfer Portal Tracker',
  description: 'Browse transfer portal activity for every college football team. View incoming and outgoing transfers by school and conference.',
  keywords: [
    'CFB Teams',
    'College Football Teams',
    'Transfer Portal by Team',
    'CFB Team Transfers',
    'College Football Rosters',
    'Team Transfer Portal',
  ],
  openGraph: {
    title: 'Browse All Teams | CFB Transfer Portal Tracker',
    description: 'Browse transfer portal activity for every college football team. View incoming and outgoing transfers by school.',
    url: 'https://www.profootballnetwork.com/cfb-hq/transfer-portal-tracker/teams',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Browse All Teams | CFB Transfer Portal Tracker',
    description: 'Browse transfer portal activity for every college football team.',
  },
  alternates: {
    canonical: 'https://www.profootballnetwork.com/cfb-hq/transfer-portal-tracker/teams',
  },
};

export default function TeamsPage() {
  return <TeamsClient />;
}
