import { NextRequest, NextResponse } from 'next/server';
import { getTeamBySlug } from '@/data/teams';
import fs from 'fs';
import path from 'path';

// Draft pick structure
interface DraftPick {
  year: number;
  round: number;
  pick: number;
  name: string;
  position: string;
  nflTeam: string;
}

interface DraftData {
  teamId: string;
  teamSlug: string;
  teamName: string;
  draftPicks: DraftPick[];
}

// Helper to read draft data from JSON file
function getDraftData(teamSlug: string): DraftData | null {
  const draftDir = path.join(process.cwd(), 'data', 'draft');

  // Try direct file path first (most common case)
  const directPath = path.join(draftDir, `${teamSlug}.json`);
  try {
    if (fs.existsSync(directPath)) {
      return JSON.parse(fs.readFileSync(directPath, 'utf-8'));
    }
  } catch (error) {
    // Fall through to directory scan
  }

  // Fallback: scan directory only if direct match fails
  try {
    const files = fs.readdirSync(draftDir);
    const teamIdPart = teamSlug.split('-')[0];
    const matchingFile = files.find(file =>
      file.startsWith(teamIdPart) || file.replace('.json', '').includes(teamIdPart)
    );

    if (matchingFile) {
      const filePath = path.join(draftDir, matchingFile);
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (error) {
    console.error('Error reading draft data:', error);
  }

  return null;
}

// Get draft statistics summary (for recent picks since 2020)
function getDraftStats(allPicks: DraftPick[]) {
  // Filter to only recent picks (2020+) for summary stats
  const recentPicks = allPicks.filter(p => p.year >= 2020);

  if (!recentPicks.length) {
    return {
      totalPicks: 0,
      firstRoundPicks: 0,
      topTenPicks: 0,
      recentPicks: 0,
      picksByRound: {},
      picksByPosition: {},
      picksByDecade: {},
    };
  }

  const firstRoundPicks = recentPicks.filter(p => p.round === 1).length;
  const topTenPicks = recentPicks.filter(p => p.round === 1 && p.pick <= 10).length;

  // Picks by round (recent only)
  const picksByRound: Record<number, number> = {};
  recentPicks.forEach(p => {
    picksByRound[p.round] = (picksByRound[p.round] || 0) + 1;
  });

  // Picks by position (recent only)
  const picksByPosition: Record<string, number> = {};
  recentPicks.forEach(p => {
    const pos = p.position || 'Unknown';
    picksByPosition[pos] = (picksByPosition[pos] || 0) + 1;
  });

  // Picks by decade (for all picks - useful context)
  const picksByDecade: Record<string, number> = {};
  allPicks.forEach(p => {
    const decade = `${Math.floor(p.year / 10) * 10}s`;
    picksByDecade[decade] = (picksByDecade[decade] || 0) + 1;
  });

  return {
    totalPicks: recentPicks.length,
    firstRoundPicks,
    topTenPicks,
    recentPicks: recentPicks.length,
    picksByRound,
    picksByPosition,
    picksByDecade,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get team info
    const team = getTeamBySlug(slug);
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Get draft data
    const draftData = getDraftData(team.slug);

    if (!draftData) {
      // Return empty data structure if no draft file found
      return NextResponse.json({
        team: team.name,
        teamId: team.id,
        slug: team.slug,
        conference: team.conference,
        draftPicks: [],
        stats: getDraftStats([]),
        lastUpdated: new Date().toISOString(),
      }, {
        headers: {
          'Cache-Control': 's-maxage=86400, stale-while-revalidate=172800',
        },
      });
    }

    // Sort picks by year (most recent first), then by round and pick
    const sortedPicks = [...draftData.draftPicks].sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      if (a.round !== b.round) return a.round - b.round;
      return a.pick - b.pick;
    });

    const stats = getDraftStats(sortedPicks);

    return NextResponse.json({
      team: team.name,
      teamId: team.id,
      slug: team.slug,
      conference: team.conference,
      draftPicks: sortedPicks,
      stats,
      lastUpdated: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 's-maxage=86400, stale-while-revalidate=172800',
      },
    });

  } catch (error) {
    console.error('Draft API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch draft data' },
      { status: 500 }
    );
  }
}
