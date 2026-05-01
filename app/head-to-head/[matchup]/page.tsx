import type { Metadata } from 'next';
import React from 'react';
import { DEFAULT_OG_IMAGE } from '@/lib/metadata';
import { allTeams } from '@/data/teams';
import HeadToHeadClient from '../HeadToHeadClient';
import { teamIdToSlug, slugToTeamId } from '../teamSlug';

const BASE = 'https://www.profootballnetwork.com/cfb-hq';

function parseMatchup(matchup: string): { team1Id: string; team2Id: string } | null {
  const vsIdx = matchup.indexOf('-vs-');
  if (vsIdx === -1) return null;
  const s1 = matchup.slice(0, vsIdx);
  const s2 = matchup.slice(vsIdx + 4);
  const t1 = slugToTeamId(s1);
  const t2 = slugToTeamId(s2);
  if (!t1 || !t2) return null;
  return { team1Id: t1, team2Id: t2 };
}

export async function generateMetadata({ params }: { params: Promise<{ matchup: string }> }): Promise<Metadata> {
  const { matchup } = await params;
  const parsed = parseMatchup(matchup);
  if (!parsed) return { title: 'CFB Head-to-Head | CFB HQ' };

  const t1 = allTeams.find(t => t.id === parsed.team1Id);
  const t2 = allTeams.find(t => t.id === parsed.team2Id);
  if (!t1 || !t2) return { title: 'CFB Head-to-Head | CFB HQ' };

  const title = `${t1.name} vs. ${t2.name} All-Time Series | CFB HQ`;
  const desc = `All-time head-to-head record between ${t1.name} and ${t2.name}. Full game log, score margins, decade breakdowns, home/away/neutral splits, and series streaks.`;

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      url: `${BASE}/head-to-head/${matchup}`,
      type: 'website',
      siteName: 'CFB HQ - Pro Football Network',
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      creator: '@PFSN365',
      site: '@PFSN365',
    },
    alternates: { canonical: `${BASE}/head-to-head/${matchup}` },
    robots: {
      index: true, follow: true,
      googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
  };
}

export default async function HeadToHeadMatchupPage({ params }: { params: Promise<{ matchup: string }> }) {
  const { matchup } = await params;
  const parsed = parseMatchup(matchup);

  return (
    <React.Suspense>
      <HeadToHeadClient
        initialTeam1={parsed?.team1Id ?? ''}
        initialTeam2={parsed?.team2Id ?? ''}
      />
    </React.Suspense>
  );
}
