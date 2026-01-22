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
    title: `${playerName} - CFB Player Profile`,
    description: `View ${playerName}'s complete college football player profile with bio, stats, and transfer portal history.`,
    keywords: [
      playerName,
      'College Football Player',
      'CFB Stats',
      'Player Profile',
      'Transfer Portal',
    ],
    openGraph: {
      title: `${playerName} - CFB Player Profile`,
      description: `View ${playerName}'s complete college football player profile.`,
      url,
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title: `${playerName} - CFB Player Profile`,
      description: `View ${playerName}'s complete college football player profile.`,
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function PlayerProfilePage({ params }: Props) {
  const { playerSlug } = await params;
  return <PlayerProfileClient playerSlug={playerSlug} />;
}
