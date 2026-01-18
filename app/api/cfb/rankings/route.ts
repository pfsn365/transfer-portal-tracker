import { NextResponse } from 'next/server';

const ESPN_RANKINGS_API = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/rankings';

// Cache for rankings data
let rankingsCache: { data: unknown; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache

export async function GET() {
  try {
    // Check cache
    if (rankingsCache && Date.now() - rankingsCache.timestamp < CACHE_DURATION) {
      return NextResponse.json(rankingsCache.data);
    }

    const response = await fetch(ESPN_RANKINGS_API, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform the data to a simpler format
    const rankings = data.rankings?.map((poll: {
      name?: string;
      shortName?: string;
      type?: string;
      ranks?: Array<{
        current: number;
        previous?: number;
        team?: {
          id?: string;
          displayName?: string;
          shortDisplayName?: string;
          logo?: string;
          location?: string;
          nickname?: string;
        };
        recordSummary?: string;
      }>;
    }) => ({
      name: poll.name || poll.shortName || 'Unknown',
      shortName: poll.shortName || poll.name,
      type: poll.type,
      ranks: poll.ranks?.map((r) => ({
        current: r.current,
        previous: r.previous,
        team: {
          id: r.team?.id,
          displayName: r.team?.displayName || r.team?.location,
          shortDisplayName: r.team?.shortDisplayName,
          logo: r.team?.logo,
          nickname: r.team?.nickname
        },
        record: r.recordSummary
      }))
    })) || [];

    const result = { rankings };

    // Update cache
    rankingsCache = { data: result, timestamp: Date.now() };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rankings' },
      { status: 500 }
    );
  }
}
