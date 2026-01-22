import type { Metadata } from 'next';
import PlayersDirectoryClient from './PlayersDirectoryClient';

export const metadata: Metadata = {
  title: 'CFB Players - Player Profiles & Stats',
  description: 'Browse college football player profiles with bio information, stats, and transfer portal history. Search and filter players by team or position.',
  keywords: [
    'CFB Players',
    'College Football Player Profiles',
    'College Football Stats',
    'College Football Roster',
    'Transfer Portal Players',
  ],
  openGraph: {
    title: 'CFB Players - Player Profiles & Stats',
    description: 'Browse college football player profiles with bio information, stats, and transfer portal history.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CFB Players - Player Profiles & Stats',
    description: 'Browse college football player profiles with bio information, stats, and transfer portal history.',
  },
};

export default function PlayersPage() {
  return <PlayersDirectoryClient />;
}
