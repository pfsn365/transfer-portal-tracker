import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'College Football Teams - Browse Transfer Portal by Team',
  description: 'Browse the transfer portal activity for all college football teams. View incoming and outgoing transfers for every FBS team organized by conference.',
  keywords: [
    'College Football Teams',
    'CFB Teams',
    'Transfer Portal Teams',
    'FBS Teams',
    'College Football Roster',
    'Team Transfers',
    'Conference Teams',
  ],
  openGraph: {
    title: 'College Football Teams - Browse Transfer Portal by Team',
    description: 'Browse the transfer portal activity for all college football teams. View incoming and outgoing transfers for every FBS team organized by conference.',
    url: 'https://www.profootballnetwork.com/cfb-hq/transfer-portal-tracker/teams',
  },
  twitter: {
    title: 'College Football Teams - Browse Transfer Portal by Team',
    description: 'Browse the transfer portal activity for all college football teams. View incoming and outgoing transfers for every FBS team organized by conference.',
  },
  alternates: {
    canonical: 'https://www.profootballnetwork.com/cfb-hq/transfer-portal-tracker/teams',
  },
};

export default function TeamsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
