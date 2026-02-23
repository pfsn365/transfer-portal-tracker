import { NextRequest, NextResponse } from 'next/server';
import { fetchSchedule, fetchScheduleByWeek, ScheduleGame } from '@/lib/espn';

// In-memory season cache per group (5-minute TTL)
const seasonCache: Record<string, { games: ScheduleGame[]; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getSeasonGames(group: '80' | '81'): Promise<ScheduleGame[]> {
  const cached = seasonCache[group];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.games;
  }

  // Fetch all regular season weeks (0-16) and postseason weeks (1-5) in parallel
  const regularSeasonPromises = Array.from({ length: 17 }, (_, week) =>
    fetchScheduleByWeek(week, 2, group).catch(() => [] as ScheduleGame[])
  );
  const postseasonPromises = Array.from({ length: 5 }, (_, i) =>
    fetchScheduleByWeek(i + 1, 3, group).catch(() => [] as ScheduleGame[])
  );

  const results = await Promise.all([...regularSeasonPromises, ...postseasonPromises]);

  // Deduplicate by game ID
  const games = Array.from(new Map(results.flat().map(game => [game.id, game])).values());

  seasonCache[group] = { games, timestamp: Date.now() };
  return games;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const week = searchParams.get('week');
    const date = searchParams.get('date');
    const month = searchParams.get('month'); // e.g. "2025-09"
    const fetchAll = searchParams.get('fetchAll') === 'true';
    const seasonType = searchParams.get('seasonType') || '2'; // 2 = regular season, 3 = postseason
    const group = searchParams.get('group') as '80' | '81' || '80'; // 80 = FBS, 81 = FCS

    let games: ScheduleGame[];

    if (month) {
      // Fetch full season (cached) and filter to requested month
      const allGames = await getSeasonGames(group);
      const [yearStr, monthStr] = month.split('-');
      const year = parseInt(yearStr);
      const mo = parseInt(monthStr) - 1; // 0-indexed
      const monthStart = new Date(year, mo, 1);
      const monthEnd = new Date(year, mo + 1, 0, 23, 59, 59, 999);

      games = allGames.filter(game => {
        const gameDate = new Date(game.date);
        return gameDate >= monthStart && gameDate <= monthEnd;
      });
    } else if (fetchAll) {
      // Bulk fetch all weeks for the entire season (uses cache)
      games = await getSeasonGames(group);
    } else if (week) {
      // Fetch by week number
      games = await fetchScheduleByWeek(parseInt(week), parseInt(seasonType), group);
    } else if (date) {
      // Fetch by specific date
      games = await fetchSchedule({ dates: date, groups: group });
    } else {
      // Fetch current/today's games
      games = await fetchSchedule({ groups: group });
    }

    // Sort games: Live first, then upcoming by time, then completed
    const sortedGames = [...games].sort((a, b) => {
      // Live games first
      if (a.status.state === 'in' && b.status.state !== 'in') return -1;
      if (a.status.state !== 'in' && b.status.state === 'in') return 1;

      // Then upcoming games
      if (a.status.state === 'pre' && b.status.state === 'post') return -1;
      if (a.status.state === 'post' && b.status.state === 'pre') return 1;

      // Sort by date/time
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    const hasLiveGames = games.some(g => g.status.state === 'in');
    const revalidateTime = hasLiveGames ? 30 : 300;

    return NextResponse.json({
      games: sortedGames,
      totalGames: sortedGames.length,
      hasLiveGames,
      lastUpdated: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': `s-maxage=${revalidateTime}, stale-while-revalidate`,
      },
    });
  } catch (error) {
    console.error('Schedule API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    );
  }
}
