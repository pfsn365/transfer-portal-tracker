import { NextResponse } from 'next/server';
import { teamSlugToEspnId } from '@/utils/espnTeamIds';
import { allTeams } from '@/data/teams';

// Global players cache
interface CachedPlayer {
  id: string;
  name: string;
  slug: string;
  jerseyNumber: string;
  position: string;
  class: string;
  height: string;
  weight: string;
  hometown: string;
  teamId: string;
  teamName: string;
  teamSlug: string;
  teamLogo: string;
  conference: string;
  headshot?: string;
}

let playersCache: CachedPlayer[] | null = null;
let playersCacheTimestamp = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
let buildPromise: Promise<void> | null = null;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CFB-Hub/1.0)',
        },
        cache: 'no-store',
      });
      if (response.ok) return response;
      if (i === retries) return response;
    } catch (error) {
      if (i === retries) throw error;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error('Fetch failed');
}

// Build players cache from all team rosters
async function buildPlayersCache(): Promise<void> {
  const players: CachedPlayer[] = [];
  const fbsTeams = Object.entries(teamSlugToEspnId);

  // Fetch all team rosters in batches
  const batchSize = 15;
  for (let i = 0; i < fbsTeams.length; i += batchSize) {
    const batch = fbsTeams.slice(i, i + batchSize);

    const rosterPromises = batch.map(async ([teamSlug, espnTeamId]) => {
      try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${espnTeamId}/roster`;
        const response = await fetchWithRetry(url);

        if (!response.ok) {
          return null;
        }

        const data = await response.json();
        return { teamSlug, espnTeamId, data };
      } catch (error) {
        return null;
      }
    });

    const results = await Promise.all(rosterPromises);

    for (const result of results) {
      if (!result) continue;

      const { teamSlug, espnTeamId, data } = result;
      const teamInfo = allTeams.find(t => t.slug === teamSlug);
      const teamData = data.team || {};

      // Flatten position groups
      const athletes: any[] = [];
      (data.athletes || []).forEach((group: any) => {
        if (group.items && Array.isArray(group.items)) {
          athletes.push(...group.items);
        }
      });

      for (const athlete of athletes) {
        // Format height
        let heightFormatted = '-';
        if (athlete.displayHeight) {
          heightFormatted = athlete.displayHeight;
        } else if (athlete.height) {
          const feet = Math.floor(athlete.height / 12);
          const inches = Math.round(athlete.height % 12);
          heightFormatted = `${feet}'${inches}"`;
        }

        // Format hometown
        const hometown = athlete.birthPlace
          ? [athlete.birthPlace.city, athlete.birthPlace.state].filter(Boolean).join(', ')
          : '-';

        players.push({
          id: athlete.id,
          name: athlete.fullName || athlete.displayName,
          slug: slugify(athlete.fullName || athlete.displayName),
          jerseyNumber: athlete.jersey || '',
          position: athlete.position?.abbreviation || '-',
          class: athlete.experience?.displayValue || '-',
          height: heightFormatted,
          weight: athlete.displayWeight || (athlete.weight ? `${athlete.weight} lbs` : '-'),
          hometown,
          teamId: String(espnTeamId),
          teamName: teamInfo?.name || teamData.displayName || teamData.name || '',
          teamSlug,
          teamLogo: teamData.logo || `https://a.espncdn.com/i/teamlogos/ncaa/500/${espnTeamId}.png`,
          conference: teamInfo?.conference || '',
          headshot: athlete.headshot?.href,
        });
      }
    }

    // Small delay between batches
    if (i + batchSize < fbsTeams.length) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  playersCache = players;
  playersCacheTimestamp = Date.now();
  console.log(`Players cache built with ${players.length} players`);
}

// Get or build players cache
async function getPlayersCache(): Promise<CachedPlayer[]> {
  const now = Date.now();

  if (playersCache && now - playersCacheTimestamp < CACHE_TTL) {
    return playersCache;
  }

  if (buildPromise) {
    await buildPromise;
    if (playersCache) return playersCache;
  }

  buildPromise = buildPlayersCache();
  try {
    await buildPromise;
  } finally {
    buildPromise = null;
  }

  return playersCache || [];
}

// Position groupings for filtering
const POSITION_GROUPS: Record<string, string[]> = {
  'QB': ['QB'],
  'RB': ['RB', 'FB'],
  'WR': ['WR'],
  'TE': ['TE'],
  'OL': ['OL', 'OT', 'OG', 'OC', 'IOL', 'C', 'G', 'T'],
  'DT': ['DT', 'NT'],
  'EDGE': ['EDGE', 'DE'],
  'LB': ['LB', 'ILB', 'OLB', 'MLB'],
  'CB': ['CB'],
  'SAF': ['S', 'SAF', 'FS', 'SS'],
  'K': ['K', 'PK'],
  'P': ['P'],
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '24');
    const search = searchParams.get('search') || '';
    const team = searchParams.get('team') || 'all';
    const position = searchParams.get('position') || 'all';
    const conference = searchParams.get('conference') || 'all';

    // Get all players
    const allPlayers = await getPlayersCache();

    // Filter players
    let filtered = allPlayers;

    // Search filter
    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.teamName.toLowerCase().includes(query) ||
        p.position.toLowerCase().includes(query)
      );
    }

    // Team filter
    if (team !== 'all') {
      filtered = filtered.filter(p => p.teamSlug === team || p.teamName === team);
    }

    // Conference filter
    if (conference !== 'all') {
      filtered = filtered.filter(p => p.conference === conference);
    }

    // Position filter with groupings
    if (position !== 'all') {
      const positionGroup = POSITION_GROUPS[position.toUpperCase()];
      if (positionGroup) {
        filtered = filtered.filter(p =>
          positionGroup.some(pos => p.position.toUpperCase() === pos)
        );
      } else {
        filtered = filtered.filter(p => p.position.toUpperCase() === position.toUpperCase());
      }
    }

    // Pagination
    const totalPlayers = filtered.length;
    const totalPages = Math.ceil(totalPlayers / limit);
    const startIndex = (page - 1) * limit;
    const paginatedPlayers = filtered.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      players: paginatedPlayers,
      pagination: {
        page,
        limit,
        totalPlayers,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}
