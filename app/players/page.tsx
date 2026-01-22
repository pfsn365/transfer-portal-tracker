import type { Metadata } from 'next';
import PlayersDirectoryClient from './PlayersDirectoryClient';

export const metadata: Metadata = {
  title: 'CFB Players 2025 - College Football Player Profiles & Stats',
  description: 'Browse 10,000+ college football player profiles with bios, career stats, game logs, and transfer portal history. Search by team, position, or name across all FBS programs.',
  keywords: [
    'CFB Players',
    'College Football Players',
    'College Football Player Profiles',
    'College Football Stats',
    'College Football Roster',
    'Transfer Portal Players',
    'FBS Players',
    'NCAA Football Players',
    'College Football Database',
  ],
  openGraph: {
    title: 'CFB Players 2025 - College Football Player Profiles & Stats',
    description: 'Browse 10,000+ college football player profiles with bios, career stats, game logs, and transfer portal history.',
    url: 'https://www.profootballnetwork.com/cfb-hq/players',
    type: 'website',
    siteName: 'CFB HQ - Pro Football Network',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CFB Players 2025 - College Football Player Profiles & Stats',
    description: 'Browse 10,000+ college football player profiles with bios, career stats, and game logs.',
  },
  alternates: {
    canonical: 'https://www.profootballnetwork.com/cfb-hq/players',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PlayersPage() {
  return <PlayersDirectoryClient />;
}
