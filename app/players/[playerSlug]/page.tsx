import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DEFAULT_OG_IMAGE } from '@/lib/metadata';
import PlayerProfileClient from './PlayerProfileClient';

interface Props {
  params: Promise<{ playerSlug: string }>;
}

interface PlayerResult {
  data: any | null;
  is404: boolean;
}

function slugToName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function getPlayerData(playerSlug: string): Promise<PlayerResult> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/cfb-hq/api/players/${playerSlug}`, {
      next: { revalidate: 300 },
    });

    if (response.status === 404) {
      return { data: null, is404: true };
    }

    if (!response.ok) {
      return { data: null, is404: false };
    }

    const data = await response.json();
    return { data, is404: false };
  } catch {
    return { data: null, is404: false };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { playerSlug } = await params;
  const { is404 } = await getPlayerData(playerSlug);

  if (is404) {
    return {
      title: 'Player Not Found',
      robots: { index: false, follow: false },
    };
  }

  const playerName = slugToName(playerSlug);
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
      images: [DEFAULT_OG_IMAGE],
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

  const { is404 } = await getPlayerData(playerSlug);
  if (is404) {
    notFound();
  }

  return <PlayerProfileClient playerSlug={playerSlug} />;
}
