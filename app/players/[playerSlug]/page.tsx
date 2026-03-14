import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DEFAULT_OG_IMAGE } from '@/lib/metadata';
import PlayerProfileClient from './PlayerProfileClient';

interface Props {
  params: Promise<{ playerSlug: string }>;
}

function slugToName(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function verifyPlayerExists(playerSlug: string): Promise<boolean> {
  try {
    const name = slugToName(playerSlug);
    const searchUrl = `https://site.web.api.espn.com/apis/common/v3/search?query=${encodeURIComponent(name)}&limit=10&type=player`;
    const response = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CFB-Hub/1.0)' },
      next: { revalidate: 3600 },
    });

    if (!response.ok) return false;

    const data = await response.json();
    const items = data?.items || [];

    for (const item of items) {
      if (item.type !== 'player') continue;
      const league = item.league?.slug || item.league?.name || '';
      if (!league.includes('college-football') && league !== 'ncaaf') continue;
      const displayName = item.displayName || item.name || '';
      if (slugify(displayName) === playerSlug) return true;
    }

    return false;
  } catch {
    // On network errors, allow the page to render (client will handle the error)
    return true;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { playerSlug } = await params;
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

  const exists = await verifyPlayerExists(playerSlug);
  if (!exists) {
    notFound();
  }

  return <PlayerProfileClient playerSlug={playerSlug} />;
}
