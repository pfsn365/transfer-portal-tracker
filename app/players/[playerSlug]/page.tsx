import type { Metadata } from 'next';
import PlayerProfileClient from './PlayerProfileClient';

interface Props {
  params: Promise<{ playerSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { playerSlug } = await params;

  // Convert slug to readable name
  const playerName = playerSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const url = `https://www.profootballnetwork.com/cfb-hq/players/${playerSlug}`;

  return {
    title: `${playerName} - College Football Player Profile & Stats 2025`,
    description: `${playerName} college football player profile with career stats, game log, bio information, and transfer history. View ${playerName}'s complete stats and player info.`,
    keywords: [
      playerName,
      `${playerName} stats`,
      `${playerName} college football`,
      'College Football Player',
      'CFB Player Stats',
      'Player Profile',
      'Game Log',
      'Career Stats',
    ],
    openGraph: {
      title: `${playerName} - College Football Player Profile`,
      description: `View ${playerName}'s college football stats, game log, and career history.`,
      url,
      type: 'profile',
      siteName: 'CFB HQ - Pro Football Network',
    },
    twitter: {
      card: 'summary',
      title: `${playerName} - CFB Player Profile`,
      description: `${playerName} college football player profile with stats and game log.`,
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function PlayerProfilePage({ params }: Props) {
  const { playerSlug } = await params;
  return <PlayerProfileClient playerSlug={playerSlug} />;
}
