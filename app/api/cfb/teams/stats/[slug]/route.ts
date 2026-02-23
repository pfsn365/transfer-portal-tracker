import { NextRequest, NextResponse } from 'next/server';
import { getTeamBySlug } from '@/data/teams';
import { getEspnIdFromSlug } from '@/utils/espnTeamIds';

// Team stat structure from ESPN
interface TeamStat {
  name: string;
  displayName: string;
  abbreviation: string;
  value: number;
  displayValue: string;
  perGameValue?: number;
  perGameDisplayValue?: string;
  rank?: number;
  rankDisplayValue?: string;
}

interface TeamStatCategory {
  name: string;
  displayName: string;
  stats: TeamStat[];
}

// Player stat structure
interface PlayerStat {
  playerId: string;
  name: string;
  position: string;
  headshot?: string;
  displayValue: string;
  value: number;
  gamesPlayed?: number;
}

interface PlayerLeaderCategory {
  name: string;
  displayName: string;
  leaders: PlayerStat[];
}

// Transformed output structures
interface TransformedTeamStats {
  passing: TeamStat[];
  rushing: TeamStat[];
  receiving: TeamStat[];
  defense: TeamStat[];
  scoring: TeamStat[];
  kicking: TeamStat[];
  punting: TeamStat[];
  returning: TeamStat[];
  general: TeamStat[];
}

interface TransformedPlayerStats {
  passing: PlayerStat[];
  rushing: PlayerStat[];
  receiving: PlayerStat[];
  tackles: PlayerStat[];
  sacks: PlayerStat[];
  interceptions: PlayerStat[];
}

// Helper to fetch JSON with error handling
async function fetchJson<T>(url: string, revalidate: number = 3600): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CFB-HQ/1.0)' },
      next: { revalidate },
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
  }
  return null;
}

// Fetch team statistics from ESPN
async function fetchTeamStats(espnId: number): Promise<TransformedTeamStats> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${espnId}/statistics`;
  const data = await fetchJson<any>(url, 1800);

  const emptyStats: TransformedTeamStats = {
    passing: [],
    rushing: [],
    receiving: [],
    defense: [],
    scoring: [],
    kicking: [],
    punting: [],
    returning: [],
    general: [],
  };

  if (!data?.results?.stats?.categories) {
    return emptyStats;
  }

  const categories = data.results.stats.categories;
  const result: TransformedTeamStats = { ...emptyStats };

  // Stats to filter out
  const excludedStats = ['sacks-yardsLost', 'sacksYardsLost'];

  for (const category of categories) {
    const stats: TeamStat[] = (category.stats || [])
      .filter((s: any) => !excludedStats.includes(s.name))
      .map((s: any) => ({
        name: s.name,
        displayName: s.displayName,
        abbreviation: s.abbreviation,
        value: s.value,
        displayValue: s.displayValue,
        perGameValue: s.perGameValue,
        perGameDisplayValue: s.perGameDisplayValue,
      }));

    switch (category.name) {
      case 'passing':
        result.passing = stats;
        break;
      case 'rushing':
        result.rushing = stats;
        break;
      case 'receiving':
        result.receiving = stats;
        break;
      case 'defensive':
      case 'defensiveInterceptions':
        result.defense = [...result.defense, ...stats];
        break;
      case 'scoring':
        result.scoring = stats;
        break;
      case 'kicking':
        result.kicking = stats;
        break;
      case 'punting':
        result.punting = stats;
        break;
      case 'returning':
        result.returning = stats;
        break;
      case 'general':
      case 'miscellaneous':
        result.general = [...result.general, ...stats];
        break;
    }
  }

  return result;
}

// Fetch player leaders from ESPN
// types/3 includes full season stats (regular + postseason)
async function fetchPlayerLeaders(espnId: number, year: number = 2025): Promise<TransformedPlayerStats> {
  const url = `https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/seasons/${year}/types/3/teams/${espnId}/leaders`;
  const data = await fetchJson<any>(url, 1800);

  const emptyStats: TransformedPlayerStats = {
    passing: [],
    rushing: [],
    receiving: [],
    tackles: [],
    sacks: [],
    interceptions: [],
  };

  if (!data?.categories) {
    return emptyStats;
  }

  const result: TransformedPlayerStats = { ...emptyStats };

  // Process each category
  for (const category of data.categories) {
    const categoryName = category.name?.toLowerCase() || '';

    // Process leaders for this category
    const leaders: PlayerStat[] = [];

    const leaderEntries = category.leaders || [];
    // Batch fetch all athlete data in parallel instead of one-by-one
    const athleteDataList = await Promise.all(
      leaderEntries.map((leader: any) =>
        leader.athlete?.$ref
          ? fetchJson<any>(leader.athlete.$ref, 86400)
          : Promise.resolve(null)
      )
    );
    for (let i = 0; i < leaderEntries.length; i++) {
      const leader = leaderEntries[i] as any;
      const athleteData = athleteDataList[i];
      const playerStat: PlayerStat = {
        playerId: athleteData?.id || leader.athlete?.id || '',
        name: athleteData?.displayName || athleteData?.fullName || 'Unknown',
        position: athleteData?.position?.abbreviation || '',
        headshot: athleteData?.headshot?.href,
        displayValue: leader.displayValue || String(leader.value),
        value: leader.value || 0,
      };
      leaders.push(playerStat);
    }

    // Map to appropriate category
    if (categoryName.includes('passing')) {
      result.passing = [...result.passing, ...leaders].slice(0, 10);
    } else if (categoryName.includes('rushing')) {
      result.rushing = [...result.rushing, ...leaders].slice(0, 10);
    } else if (categoryName.includes('receiving') || categoryName.includes('receptions')) {
      result.receiving = [...result.receiving, ...leaders].slice(0, 10);
    } else if (categoryName.includes('tackle')) {
      result.tackles = [...result.tackles, ...leaders].slice(0, 10);
    } else if (categoryName.includes('sack')) {
      result.sacks = [...result.sacks, ...leaders].slice(0, 10);
    } else if (categoryName.includes('interception')) {
      result.interceptions = [...result.interceptions, ...leaders].slice(0, 10);
    }
  }

  return result;
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

    // Get ESPN ID
    const espnId = getEspnIdFromSlug(slug);
    if (!espnId) {
      return NextResponse.json(
        { error: 'ESPN ID not found for team' },
        { status: 404 }
      );
    }

    // Determine season year
    const now = new Date();
    const month = now.getMonth();
    const year = month < 7 ? now.getFullYear() - 1 : now.getFullYear();

    // Fetch both team stats and player leaders in parallel
    const [teamStats, playerStats] = await Promise.all([
      fetchTeamStats(espnId),
      fetchPlayerLeaders(espnId, year),
    ]);

    return NextResponse.json({
      team: team.name,
      teamId: team.id,
      slug: team.slug,
      conference: team.conference,
      teamStats,
      playerStats,
      season: year,
      lastUpdated: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600',
      },
    });

  } catch (error) {
    console.error('Team Stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team stats' },
      { status: 500 }
    );
  }
}
